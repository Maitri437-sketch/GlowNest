// ─────────────────────────────────────
//  controllers/aiController.js
//  AI Skincare Chatbot – Dermatologist Flow
// ─────────────────────────────────────

const AIChatHistory = require('../models/AIChatHistory');
const { v4: uuidv4 } = require('crypto');

// ── Skincare AI knowledge base ──
const ROUTINES = {
  oily: {
    morning: [
      'Gentle foaming cleanser (e.g. CeraVe Foaming)',
      'Niacinamide 10% serum (The Ordinary)',
      'Oil-free water gel moisturizer (Neutrogena Hydro Boost)',
      'SPF 50 sunscreen (Minimalist Sun)'
    ],
    evening: [
      'Oil cleanser → gentle foaming cleanser (double cleanse)',
      'Salicylic acid 2% BHA (Paula\'s Choice or The Ordinary)',
      'Light gel moisturizer'
    ],
    tips: [
      'Use blotting papers during the day instead of washing your face',
      'Avoid heavy cream moisturizers — they can clog pores',
      'Never skip SPF — oily skin still needs sun protection',
      'Niacinamide helps regulate sebum production over time'
    ]
  },
  dry: {
    morning: [
      'Hydrating cream cleanser (CeraVe Hydrating)',
      'Hyaluronic acid serum (The Inkey List or The Ordinary)',
      'Rich cream moisturizer (CeraVe Moisturizing Cream)',
      'SPF 50 sunscreen with moisturizing base'
    ],
    evening: [
      'Gentle cream or micellar cleanser',
      'Peptide serum or retinol (low strength, 0.025%)',
      'Thick night cream or sleeping mask',
      'Facial oil on top if very dry (squalane)'
    ],
    tips: [
      'Apply serums while skin is still slightly damp to lock in moisture',
      'Avoid hot showers — they strip your skin barrier',
      'Drink at least 2 litres of water daily',
      'Look for ingredients: ceramides, glycerin, hyaluronic acid'
    ]
  },
  combination: {
    morning: [
      'Gentle gel cleanser',
      'Niacinamide serum on oily zones (T-zone)',
      'Lightweight moisturizer (balance formula)',
      'SPF 50 sunscreen'
    ],
    evening: [
      'Micellar water + gel cleanser',
      'AHA toner 2-3x per week',
      'Light moisturizer (gel-cream)',
      'Spot treatment on oily/acne areas if needed'
    ],
    tips: [
      'Use different products on different zones if needed',
      'Avoid over-washing — it worsens combination skin',
      'AHAs help even out texture across your whole face'
    ]
  },
  sensitive: {
    morning: [
      'Fragrance-free gentle cleanser (La Roche-Posay Toleriane)',
      'Centella Asiatica or Aloe Vera serum (calming)',
      'Fragrance-free barrier moisturizer',
      'Mineral SPF 50 (zinc oxide based – gentler)'
    ],
    evening: [
      'Micellar water (Bioderma Sensibio)',
      'Panthenol or ceramide serum (repair)',
      'Rich fragrance-free moisturizer'
    ],
    tips: [
      'Always patch test new products for 48 hours before full use',
      'Avoid fragrances, essential oils, and alcohol in products',
      'Introduce one new product at a time',
      'Less is more — a simple routine is best for sensitive skin'
    ]
  },
  normal: {
    morning: [
      'Gentle cleanser',
      'Vitamin C serum (for glow and protection)',
      'Lightweight moisturizer',
      'SPF 50 sunscreen'
    ],
    evening: [
      'Gentle cleanser',
      'Retinol serum (start 0.05%, 2-3x/week)',
      'Nourishing moisturizer'
    ],
    tips: [
      'Maintain your routine consistently',
      'Focus on anti-aging ingredients like retinol and Vitamin C',
      'Your skin is balanced — don\'t over-complicate your routine'
    ]
  }
};

const CONCERN_ADVICE = {
  acne: 'For acne: Use salicylic acid (BHA) 2% and niacinamide. Avoid popping pimples. Change pillowcases weekly.',
  pigmentation: 'For pigmentation: Vitamin C serum + SPF daily is essential. Niacinamide and alpha arbutin help fade dark spots.',
  dark_circles: 'For dark circles: Use caffeine eye serum, get 7-8 hours sleep, stay hydrated, use cold eye compress.',
  dryness: 'For dryness: Layer hydration — hyaluronic acid first, then moisturizer, then oil if needed.',
  oiliness: 'For oiliness: Niacinamide 10% regulates sebum. Use lightweight non-comedogenic products.',
  anti_aging: 'For anti-aging: Retinol at night, Vitamin C in morning, SPF always. Peptides help firm skin.',
  uneven_tone: 'For uneven tone: AHA exfoliation (glycolic or lactic acid) 2-3x per week + Vitamin C serum + SPF.'
};

// ── Generate AI response based on conversation step ──
const generateAIResponse = (step, userInput, skinProfile) => {
  const input = userInput.toLowerCase();

  switch (step) {
    case 0:
      return {
        message: `Hello! 👋 Nice to meet you, ${userInput}! I'm your GlowNest AI Dermatologist.\n\nI'll ask you a few quick questions to create your personalized skincare routine. Let's start — what's your skin type?`,
        options: ['Oily 😅', 'Dry 😩', 'Combination', 'Sensitive 🌸', 'Normal ✨'],
        nextStep: 1
      };

    case 1: {
      let skinType = 'normal';
      if (input.includes('oily'))       skinType = 'oily';
      else if (input.includes('dry'))   skinType = 'dry';
      else if (input.includes('comb'))  skinType = 'combination';
      else if (input.includes('sens'))  skinType = 'sensitive';

      return {
        message: `Got it — ${skinType} skin! 🌿\n\nNow, what are your main skin concerns? (You can mention multiple)`,
        options: ['Acne / Breakouts', 'Pigmentation', 'Dark circles', 'Dryness', 'Oiliness', 'Anti-aging', 'Uneven tone'],
        skinType,
        nextStep: 2
      };
    }

    case 2:
      return {
        message: `Understood! Those are very common concerns and totally treatable. 💪\n\nWhat products are you currently using? Or are you starting fresh?`,
        options: ['Basic cleanser + moisturizer only', 'Some serums already', 'Full routine', 'Starting completely fresh 🌿'],
        nextStep: 3
      };

    case 3: {
      const skin = skinProfile.skinType || 'normal';
      const routine = ROUTINES[skin] || ROUTINES.normal;
      const concerns = skinProfile.concerns || [];

      let concernAdvice = '';
      concerns.forEach(c => {
        const key = c.toLowerCase().replace(/ \/ /g, '_').replace(/ /g, '_');
        if (CONCERN_ADVICE[key]) {
          concernAdvice += `\n• ${CONCERN_ADVICE[key]}`;
        }
      });

      return {
        message: `Perfect! Here's your personalized routine for **${skin} skin** 👇\n\n☀️ **Morning Routine:**\n${routine.morning.map(s => `• ${s}`).join('\n')}\n\n🌙 **Evening Routine:**\n${routine.evening.map(s => `• ${s}`).join('\n')}\n\n💡 **Key Tips:**\n${routine.tips.map(s => `• ${s}`).join('\n')}${concernAdvice ? `\n\n🎯 **For Your Concerns:**${concernAdvice}` : ''}`,
        options: ['Tell me more about serums', 'Which sunscreen is best?', 'Can I add retinol?', 'Save this routine 💾', 'Ask another question'],
        routine,
        nextStep: 4
      };
    }

    case 4:
    default: {
      // Free-form follow-up responses
      if (input.includes('retinol')) {
        return {
          message: `Great question about retinol! 🌙\n\nFor beginners:\n• Start with 0.025% or 0.05% strength\n• Use only 2-3 times per week at night\n• Always moisturize right after\n• MUST wear SPF the next morning\n• Expect 2-4 weeks of purging before results\n\nBest beginner retinols: The Ordinary Retinol 0.2%, Paula's Choice 0.1% Booster`,
          options: ['What about Vitamin C?', 'How long before I see results?', 'Can I use with niacinamide?'],
          nextStep: 4
        };
      }
      if (input.includes('vitamin c') || input.includes('vit c')) {
        return {
          message: `Vitamin C is your best friend for glowing skin! ✨\n\n• Use in the MORNING (not night — it degrades)\n• Apply before moisturizer and SPF\n• Start with 10% L-Ascorbic Acid\n• Keep in a dark bottle away from sunlight\n• Can sting slightly — that's normal!\n\nBest options: Minimalist 10% Vitamin C, The Ordinary Vitamin C Suspension`,
          options: ['Can I mix with SPF?', 'Best time to apply?', 'What about retinol at night?'],
          nextStep: 4
        };
      }
      if (input.includes('sunscreen') || input.includes('spf')) {
        return {
          message: `SPF is the #1 anti-aging product — non-negotiable! ☀️\n\n• Use SPF 30 minimum, SPF 50 recommended\n• Apply as the LAST step in morning routine\n• Reapply every 2 hours outdoors\n• For oily skin: Minimalist Sun SPF 50 or Isntree Hyaluronic Acid Sun Gel\n• For dry skin: COSRX Aloe SPF 50 or La Roche-Posay SPF 50\n• For sensitive: Altruist SPF 50 (mineral/zinc based)`,
          options: ['Do I need SPF indoors?', 'Best budget sunscreen?', 'What about tinted SPF?'],
          nextStep: 4
        };
      }
      if (input.includes('niacinamide')) {
        return {
          message: `Niacinamide (Vitamin B3) is a true skincare hero! 🌿\n\n✅ Benefits:\n• Reduces oiliness and pores\n• Fades dark spots and pigmentation\n• Strengthens skin barrier\n• Anti-inflammatory (great for acne)\n\n📋 How to use:\n• 10% is fine for most skin types\n• Use morning and/or evening\n• Can be mixed with most other actives\n• Safe to use daily`,
          options: ['Can I mix with Vitamin C?', 'Which brand is best?', 'How long to see results?'],
          nextStep: 4
        };
      }

      // Default catch-all
      return {
        message: `That's a great skincare question! Here's what I recommend 🌸\n\nFor best results with any new product:\n• Always patch test for 48 hours first\n• Introduce one new product at a time (wait 2 weeks)\n• Consistency is key — most products take 4-8 weeks\n• Take weekly progress photos in the same lighting\n\nWould you like specific advice on any ingredient or concern?`,
        options: ['Tell me about SPF', 'What serums do I need?', 'Help with my acne', 'Build my routine again'],
        nextStep: 4
      };
    }
  }
};

// ──────────────────────────────────────
//  @route  POST /api/ai/chat
//  @desc   Send message to AI dermatologist
//  @access Private
// ──────────────────────────────────────
exports.chat = async (req, res) => {
  try {
    const { message, sessionId, step = 0, skinProfile = {} } = req.body;

    if (!message) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    // Generate AI response
    const aiResponse = generateAIResponse(step, message, skinProfile);

    // Save to DB
    let session = await AIChatHistory.findOne({
      user: req.user._id,
      sessionId
    });

    if (!session) {
      session = new AIChatHistory({
        user:      req.user._id,
        sessionId: sessionId || `session_${Date.now()}`,
        messages:  []
      });
    }

    // Add user message and AI response
    session.messages.push({ role: 'user',      content: message });
    session.messages.push({ role: 'assistant', content: aiResponse.message });

    // Update skin profile if gathered
    if (aiResponse.skinType) {
      session.skinProfile = { ...session.skinProfile, skinType: aiResponse.skinType };
    }
    if (aiResponse.routine) {
      session.routine = aiResponse.routine;
    }

    await session.save();

    res.status(200).json({
      success:   true,
      sessionId: session.sessionId,
      response:  aiResponse.message,
      options:   aiResponse.options || [],
      nextStep:  aiResponse.nextStep,
      routine:   aiResponse.routine || null
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  GET /api/ai/history
//  @desc   Get AI chat history for user
//  @access Private
// ──────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const sessions = await AIChatHistory.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    res.status(200).json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────
//  @route  GET /api/ai/routine
//  @desc   Get latest saved routine for user
//  @access Private
// ──────────────────────────────────────
exports.getRoutine = async (req, res) => {
  try {
    const latest = await AIChatHistory.findOne({
      user:    req.user._id,
      routine: { $exists: true, $ne: {} }
    }).sort({ createdAt: -1 });

    if (!latest || !latest.routine) {
      return res.status(404).json({ success: false, message: 'No saved routine found. Start an AI consultation!' });
    }

    res.status(200).json({
      success:     true,
      skinProfile: latest.skinProfile,
      routine:     latest.routine
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
