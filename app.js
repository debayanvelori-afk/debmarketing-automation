(function () {
  var STORAGE_KEY = 'landing-page-analyses';

  // DOM refs
  var textArea = document.getElementById('page-text');
  var analyzeBtn = document.getElementById('analyze-btn');
  var resultsSection = document.getElementById('results');
  var scoreCircle = document.getElementById('score-circle');
  var scoreValue = document.getElementById('score-value');
  var headlineScore = document.getElementById('headline-score');
  var headlineMeter = document.getElementById('headline-meter');
  var headlineSuggestions = document.getElementById('headline-suggestions');
  var ctaScore = document.getElementById('cta-score');
  var ctaMeter = document.getElementById('cta-meter');
  var ctaSuggestions = document.getElementById('cta-suggestions');
  var readabilityScore = document.getElementById('readability-score');
  var readabilityMeter = document.getElementById('readability-meter');
  var readabilitySuggestions = document.getElementById('readability-suggestions');
  var improvementsList = document.getElementById('improvements');
  var historyList = document.getElementById('history-list');
  var clearHistoryBtn = document.getElementById('clear-history');

  var CIRCUMFERENCE = 2 * Math.PI * 52; // ~326.73

  // --- Analysis Engine ---

  function analyzeHeadline(text) {
    var lines = text.trim().split('\n').filter(function (l) { return l.trim().length > 0; });
    var headline = lines.length > 0 ? lines[0].trim() : '';
    var score = 0;
    var suggestions = [];

    if (!headline) {
      return { score: 0, suggestions: [{ text: 'No headline detected. Start with a strong headline.', level: 'bad' }] };
    }

    var wordCount = headline.split(/\s+/).length;

    // Length check (6-12 words ideal)
    if (wordCount >= 6 && wordCount <= 12) {
      score += 30;
      suggestions.push({ text: 'Good headline length (' + wordCount + ' words)', level: 'good' });
    } else if (wordCount >= 3 && wordCount <= 15) {
      score += 20;
      suggestions.push({ text: 'Headline length is okay. Aim for 6-12 words.', level: 'warn' });
    } else {
      score += 5;
      suggestions.push({ text: 'Headline is too ' + (wordCount < 3 ? 'short' : 'long') + '. Aim for 6-12 words.', level: 'bad' });
    }

    // Power words
    var powerWords = ['free', 'new', 'proven', 'instant', 'easy', 'discover', 'secret', 'ultimate',
      'exclusive', 'guaranteed', 'powerful', 'revolutionary', 'transform', 'boost', 'unlock',
      'master', 'save', 'fast', 'simple', 'best', 'top', 'amazing', 'incredible', 'supercharge'];
    var lowerHeadline = headline.toLowerCase();
    var foundPower = powerWords.filter(function (w) { return lowerHeadline.indexOf(w) !== -1; });
    if (foundPower.length >= 2) {
      score += 25;
      suggestions.push({ text: 'Great use of power words: ' + foundPower.join(', '), level: 'good' });
    } else if (foundPower.length === 1) {
      score += 15;
      suggestions.push({ text: 'Uses power word "' + foundPower[0] + '". Try adding more.', level: 'warn' });
    } else {
      score += 0;
      suggestions.push({ text: 'Add power words like "free", "proven", "instant", or "easy".', level: 'bad' });
    }

    // Number/statistic
    if (/\d/.test(headline)) {
      score += 15;
      suggestions.push({ text: 'Contains a number/statistic for credibility.', level: 'good' });
    } else {
      suggestions.push({ text: 'Add a specific number or statistic for more impact.', level: 'warn' });
    }

    // Emotional/benefit oriented
    var benefitWords = ['you', 'your', 'grow', 'increase', 'improve', 'achieve', 'get', 'start', 'stop', 'without', 'never'];
    var foundBenefit = benefitWords.filter(function (w) { return lowerHeadline.indexOf(w) !== -1; });
    if (foundBenefit.length > 0) {
      score += 15;
      suggestions.push({ text: 'Benefit-oriented language detected.', level: 'good' });
    } else {
      suggestions.push({ text: 'Make the headline more benefit-focused. Use "you/your".', level: 'warn' });
    }

    // Urgency
    var urgencyWords = ['now', 'today', 'limited', 'hurry', 'last chance', 'don\'t miss', 'before', 'deadline'];
    var hasUrgency = urgencyWords.some(function (w) { return lowerHeadline.indexOf(w) !== -1; });
    if (hasUrgency) {
      score += 15;
      suggestions.push({ text: 'Good use of urgency.', level: 'good' });
    }

    return { score: Math.min(score, 100), suggestions: suggestions };
  }

  function analyzeCTA(text) {
    var lowerText = text.toLowerCase();
    var score = 0;
    var suggestions = [];

    // CTA button phrases
    var ctaPhrases = [
      'sign up', 'get started', 'start free', 'try free', 'buy now', 'shop now',
      'learn more', 'download', 'subscribe', 'join', 'register', 'book a demo',
      'get your', 'claim your', 'start your', 'begin your', 'grab your',
      'order now', 'add to cart', 'contact us', 'request a demo', 'schedule',
      'try it', 'get access', 'start now', 'join now', 'enroll', 'apply now'
    ];

    var foundCTAs = ctaPhrases.filter(function (c) { return lowerText.indexOf(c) !== -1; });

    if (foundCTAs.length >= 2) {
      score += 35;
      suggestions.push({ text: 'Multiple CTAs found: ' + foundCTAs.slice(0, 3).join(', '), level: 'good' });
    } else if (foundCTAs.length === 1) {
      score += 20;
      suggestions.push({ text: 'CTA found: "' + foundCTAs[0] + '". Consider adding a secondary CTA.', level: 'warn' });
    } else {
      suggestions.push({ text: 'No clear CTA detected. Add phrases like "Get Started" or "Sign Up".', level: 'bad' });
    }

    // Action verbs
    var actionVerbs = ['get', 'start', 'discover', 'learn', 'join', 'try', 'build', 'create', 'launch', 'grow', 'boost', 'claim', 'grab'];
    var foundActions = actionVerbs.filter(function (v) { return lowerText.indexOf(v) !== -1; });
    if (foundActions.length >= 3) {
      score += 25;
      suggestions.push({ text: 'Strong action-oriented language.', level: 'good' });
    } else if (foundActions.length >= 1) {
      score += 15;
      suggestions.push({ text: 'Some action words found. Add more commanding verbs.', level: 'warn' });
    } else {
      suggestions.push({ text: 'Use action verbs like "Get", "Start", "Discover".', level: 'bad' });
    }

    // Value proposition near CTA
    var valueWords = ['free', 'no credit card', 'no obligation', 'risk-free', 'money-back', 'guarantee', 'trial', 'bonus', 'discount'];
    var foundValue = valueWords.filter(function (v) { return lowerText.indexOf(v) !== -1; });
    if (foundValue.length > 0) {
      score += 25;
      suggestions.push({ text: 'Value reinforcement found: ' + foundValue.join(', '), level: 'good' });
    } else {
      suggestions.push({ text: 'Add risk reducers near CTA: "free trial", "no credit card", "money-back guarantee".', level: 'warn' });
    }

    // Urgency near CTA
    var urgencyWords = ['now', 'today', 'limited', 'exclusive', 'only', 'hurry', 'last chance', 'ending soon'];
    var hasUrgency = urgencyWords.some(function (w) { return lowerText.indexOf(w) !== -1; });
    if (hasUrgency) {
      score += 15;
      suggestions.push({ text: 'Urgency elements present.', level: 'good' });
    } else {
      suggestions.push({ text: 'Add urgency: "limited time", "today only", "only X spots left".', level: 'warn' });
    }

    return { score: Math.min(score, 100), suggestions: suggestions };
  }

  function analyzeReadability(text) {
    var score = 0;
    var suggestions = [];

    if (!text.trim()) {
      return { score: 0, suggestions: [{ text: 'No text to analyze.', level: 'bad' }] };
    }

    var sentences = text.split(/[.!?]+/).filter(function (s) { return s.trim().length > 0; });
    var words = text.split(/\s+/).filter(function (w) { return w.length > 0; });
    var wordCount = words.length;
    var sentenceCount = Math.max(sentences.length, 1);
    var avgWordsPerSentence = wordCount / sentenceCount;

    // Sentence length
    if (avgWordsPerSentence <= 15) {
      score += 25;
      suggestions.push({ text: 'Good sentence length (avg ' + avgWordsPerSentence.toFixed(1) + ' words).', level: 'good' });
    } else if (avgWordsPerSentence <= 22) {
      score += 15;
      suggestions.push({ text: 'Sentences are a bit long (avg ' + avgWordsPerSentence.toFixed(1) + '). Aim for under 15 words.', level: 'warn' });
    } else {
      score += 5;
      suggestions.push({ text: 'Sentences too long (avg ' + avgWordsPerSentence.toFixed(1) + '). Break them up.', level: 'bad' });
    }

    // Paragraph structure
    var paragraphs = text.split(/\n\s*\n/).filter(function (p) { return p.trim().length > 0; });
    if (paragraphs.length >= 3) {
      score += 20;
      suggestions.push({ text: 'Well-structured with ' + paragraphs.length + ' paragraphs.', level: 'good' });
    } else if (paragraphs.length === 2) {
      score += 12;
      suggestions.push({ text: 'Only 2 sections. Break content into more scannable chunks.', level: 'warn' });
    } else {
      score += 5;
      suggestions.push({ text: 'Single block of text. Break into multiple paragraphs for scannability.', level: 'bad' });
    }

    // Word complexity (syllable approximation)
    var complexWords = words.filter(function (w) {
      return w.replace(/[^a-zA-Z]/g, '').length > 8;
    });
    var complexRatio = complexWords.length / Math.max(wordCount, 1);
    if (complexRatio < 0.1) {
      score += 25;
      suggestions.push({ text: 'Language is simple and accessible.', level: 'good' });
    } else if (complexRatio < 0.2) {
      score += 15;
      suggestions.push({ text: 'Some complex words. Simplify for broader appeal.', level: 'warn' });
    } else {
      score += 5;
      suggestions.push({ text: 'Too many complex words. Use simpler language.', level: 'bad' });
    }

    // Content length
    if (wordCount >= 100 && wordCount <= 500) {
      score += 20;
      suggestions.push({ text: 'Good content length (' + wordCount + ' words).', level: 'good' });
    } else if (wordCount >= 50 && wordCount <= 800) {
      score += 12;
      suggestions.push({ text: wordCount + ' words. Ideal range is 100-500 for landing pages.', level: 'warn' });
    } else if (wordCount < 50) {
      score += 5;
      suggestions.push({ text: 'Too little content (' + wordCount + ' words). Add more to persuade visitors.', level: 'bad' });
    } else {
      score += 5;
      suggestions.push({ text: 'Content may be too long (' + wordCount + ' words). Keep it concise.', level: 'bad' });
    }

    // Bullet points / lists
    var hasBullets = /[-*]\s/.test(text) || /\d+[.)]\s/.test(text);
    if (hasBullets) {
      score += 10;
      suggestions.push({ text: 'Uses bullet points or lists for scannability.', level: 'good' });
    } else {
      suggestions.push({ text: 'Add bullet points or lists to improve scannability.', level: 'warn' });
    }

    return { score: Math.min(score, 100), suggestions: suggestions };
  }

  function generateImprovements(headline, cta, readability, text) {
    var improvements = [];

    if (headline.score < 50) {
      improvements.push('Rewrite your headline to be more compelling. Use power words and make a clear promise to the reader.');
    }
    if (cta.score < 40) {
      improvements.push('Add a clear, prominent call-to-action. Use action verbs and tell visitors exactly what to do next.');
    }
    if (readability.score < 50) {
      improvements.push('Improve readability by using shorter sentences, simpler words, and breaking text into paragraphs.');
    }

    var lowerText = text.toLowerCase();

    if (lowerText.indexOf('testimonial') === -1 && lowerText.indexOf('review') === -1 && lowerText.indexOf('customer') === -1 && lowerText.indexOf('said') === -1) {
      improvements.push('Add social proof: testimonials, reviews, case studies, or customer logos.');
    }

    if (!/\d/.test(text)) {
      improvements.push('Include specific numbers and statistics to build credibility (e.g., "10,000+ customers").');
    }

    if (lowerText.indexOf('guarantee') === -1 && lowerText.indexOf('risk-free') === -1 && lowerText.indexOf('money-back') === -1) {
      improvements.push('Add a guarantee or risk-reversal to reduce purchase anxiety.');
    }

    if (headline.score >= 70 && cta.score >= 70 && readability.score >= 70) {
      improvements.push('Strong foundation! Consider A/B testing headline variations to optimize further.');
    }

    return improvements;
  }

  // --- UI Rendering ---

  function getScoreClass(score) {
    if (score >= 70) return 'high';
    if (score >= 40) return 'mid';
    return 'low';
  }

  function renderResults(headline, cta, readability, overall, improvements) {
    resultsSection.classList.remove('hidden');

    // Overall score ring
    var cls = getScoreClass(overall);
    var offset = CIRCUMFERENCE - (overall / 100) * CIRCUMFERENCE;
    scoreCircle.style.strokeDashoffset = offset;
    scoreCircle.className.baseVal = 'score-fill stroke-' + cls;
    scoreValue.textContent = overall;
    scoreValue.className = 'score-number score-' + cls;

    // Metric cards
    renderMetric(headlineScore, headlineMeter, headlineSuggestions, headline);
    renderMetric(ctaScore, ctaMeter, ctaSuggestions, cta);
    renderMetric(readabilityScore, readabilityMeter, readabilitySuggestions, readability);

    // Improvements
    improvementsList.innerHTML = '';
    improvements.forEach(function (imp) {
      var li = document.createElement('li');
      li.textContent = imp;
      improvementsList.appendChild(li);
    });
  }

  function renderMetric(scoreEl, meterEl, suggestionsEl, data) {
    var cls = getScoreClass(data.score);
    scoreEl.textContent = data.score;
    scoreEl.className = 'metric-score score-' + cls;
    meterEl.style.width = data.score + '%';
    meterEl.className = 'meter-fill fill-' + cls;

    suggestionsEl.innerHTML = '';
    data.suggestions.forEach(function (s) {
      var li = document.createElement('li');
      li.className = s.level;
      li.textContent = s.text;
      suggestionsEl.appendChild(li);
    });
  }

  // --- History ---

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }

  function addToHistory(text, overall, headline, cta, readability) {
    var history = loadHistory();
    history.unshift({
      id: Date.now().toString(),
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      preview: text.substring(0, 100),
      text: text,
      overall: overall,
      headline: headline,
      cta: cta,
      readability: readability
    });
    if (history.length > 20) history = history.slice(0, 20);
    saveHistory(history);
    renderHistory();
  }

  function renderHistory() {
    var history = loadHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyList.innerHTML = '<p class="empty-history">No analyses yet</p>';
      return;
    }

    history.forEach(function (item) {
      var div = document.createElement('div');
      div.className = 'history-item';
      var cls = getScoreClass(item.overall);

      div.innerHTML =
        '<div class="history-item-score">' +
          '<span class="score-' + cls + '">' + item.overall + '</span>' +
          '<span class="history-item-date">' + item.date + '</span>' +
        '</div>' +
        '<div class="history-item-preview">' + escapeHTML(item.preview) + '</div>' +
        '<div class="history-item-metrics">' +
          '<span>H:' + item.headline + '</span>' +
          '<span>CTA:' + item.cta + '</span>' +
          '<span>R:' + item.readability + '</span>' +
        '</div>';

      div.addEventListener('click', function () {
        textArea.value = item.text;
        runAnalysis();
      });

      historyList.appendChild(div);
    });
  }

  function escapeHTML(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // --- Main ---

  function runAnalysis() {
    var text = textArea.value.trim();
    if (!text) return;

    var headline = analyzeHeadline(text);
    var cta = analyzeCTA(text);
    var readability = analyzeReadability(text);

    var overall = Math.round(headline.score * 0.35 + cta.score * 0.35 + readability.score * 0.3);
    var improvements = generateImprovements(headline, cta, readability, text);

    renderResults(headline, cta, readability, overall, improvements);
    addToHistory(text, overall, headline.score, cta.score, readability.score);
  }

  analyzeBtn.addEventListener('click', runAnalysis);

  clearHistoryBtn.addEventListener('click', function () {
    localStorage.removeItem(STORAGE_KEY);
    renderHistory();
  });

  // Init
  renderHistory();
})();
