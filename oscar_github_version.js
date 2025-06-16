// יצירת תגובה
    const response = generateSmartResponse(analysis, foundMovies, message);// 🎬 אוסקר - בוט המלצות סרטים עם Gemini AI (גרסת GitHub Pages)

// 🎭 הודעות פתיחה
const welcomeMessages = [
  "שלום! אני אוסקר, בוט המלצות הסרטים שלך 🎬 איזה סרט מעניין אותך היום?",
  "היי! אני אוסקר ואני מתמחה בהמלצות סרטים 🍿 מה תרצה לראות?",
  "ברוכים הבאים! אני אוסקר ואשמח לעזור לך למצוא סרט מושלם 🎭 מה אתה מחפש?"
];

// 🔑 הגדרות Gemini API
const GEMINI_API_KEY = "AIzaSyAq-ngUJxyiZM2zkKyyv2yq2b5KsDx5c1M";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// 🧠 זיכרון השיחה המשופר
let conversationMemory = {
  lastGenres: [],
  lastMoods: [],
  lastPlatforms: [],
  lastRecommendations: [],
  lastQuestion: null,
  userPreferences: {
    age: null,
    duration: null,
    favoriteActors: [],
    favoriteDirectors: []
  },
  conversationState: "collecting_info", // collecting_info או recommending
  collectedInfo: {
    genres: false,
    age: false,
    mood: false,
    duration: false,
    platforms: false
  },
  recommendationOffset: 0
};

// 📚 שאלות אינטראקטיביות
const interactiveQuestions = [
  {
    id: "genres",
    question: "איזה סוגי סרטים אתה אוהב? (למשל: אקשן, קומדיה, דרמה וכו') 🎭",
    keywords: ["ז'אנר", "סוג", "סרטים", "אוהב"]
  },
  {
    id: "age",
    question: "מה הגיל שלך? זה יעזור לי להתאים סרטים מתאימים 👥",
    keywords: ["גיל", "בן", "בת", "ילד", "מבוגר"]
  },
  {
    id: "duration",
    question: "כמה זמן יש לך לצפות בסרט? (קצר/בינוני/ארוך) 🕒",
    keywords: ["זמן", "אורך", "כמה זמן", "משך"]
  },
  {
    id: "platforms",
    question: "האם יש לך מנוי לנטפליקס, יס או הוט? 📺",
    keywords: ["פלטפורמה", "מנוי", "נטפליקס", "יס", "הוט"]
  }
];

// 📚 מאגר סרטים זמני
const backupMovies = [
  {
    Title: "המצאה מתוקה",
    Release_Year: 2024,
    Duration: 90,
    Rating: 7.5,
    Director: "במאי דוגמה",
    Stars: "שחקן א', שחקנית ב'",
    Genres: "Animation, Comedy, Family",
    ageRange: "7+",
    Writer: "תסריטאי דוגמה",
    "נטפליקס": 1,
    "יס": 1,
    "הוט": 0,
    trailer: "https://www.youtube.com/results?search_query=המצאה+מתוקה+2024+trailer"
  },
  {
    Title: "המבול",
    Release_Year: 2023,
    Duration: 130,
    Rating: 8.5,
    Director: "גיא נתיב",
    Stars: "צחי הלוי, איה כורם",
    Genres: "Action, Drama",
    ageRange: "16+",
    Writer: "תסריטאי מוכר",
    "נטפליקס": 1,
    "יס": 0,
    "הוט": 1,
    trailer: "https://www.youtube.com/watch?v=QxJQbGY3LcI"
  },
  {
    Title: "ג'וקר",
    Release_Year: 2019,
    Duration: 122,
    Rating: 8.4,
    Director: "Todd Phillips",
    Stars: "Joaquin Phoenix",
    Genres: "Drama, Thriller",
    ageRange: "17+",
    Writer: "Todd Phillips",
    "נטפליקס": 1,
    "יס": 1,
    "הוט": 0,
    trailer: "https://www.youtube.com/watch?v=zAGVQLHvwOY"
  },
  {
    Title: "המטריקס",
    Release_Year: 1999,
    Duration: 136,
    Rating: 8.7,
    Director: "The Wachowskis",
    Stars: "Keanu Reeves, Laurence Fishburne",
    Genres: "Action, Sci-Fi",
    ageRange: "17+",
    Writer: "The Wachowskis",
    "נטפליקס": 1,
    "יס": 0,
    "הוט": 1,
    trailer: "https://www.youtube.com/results?search_query=matrix+1999+trailer"
  },
  {
    Title: "שר הטבעות: אחוות הטבעת",
    Release_Year: 2001,
    Duration: 178,
    Rating: 8.8,
    Director: "Peter Jackson",
    Stars: "Elijah Wood, Ian McKellen",
    Genres: "Adventure, Drama, Fantasy",
    ageRange: "13+",
    Writer: "J.R.R. Tolkien",
    "נטפליקס": 0,
    "יס": 1,
    "הוט": 1,
    trailer: "https://www.youtube.com/results?search_query=lord+rings+fellowship+trailer"
  }
];

// 📚 טעינת מאגר סרטים
let moviesDatabase = null;

async function loadMoviesDatabase() {
  if (moviesDatabase) return moviesDatabase;
  
  try {
    console.log("📚 מנסה לטעון את מאגר הסרטים...");
    const response = await fetch('movies.json');
    
    if (!response.ok) {
      throw new Error(`Failed to load movies: ${response.status}`);
    }
    
    moviesDatabase = await response.json();
    console.log(`✅ נטענו ${moviesDatabase.length} סרטים מהמאגר`);
    return moviesDatabase;
  } catch (error) {
    console.error("❌ שגיאה בטעינת הסרטים:", error);
    console.log("⚠️ משתמש במאגר סרטים זמני");
    moviesDatabase = backupMovies;
    return moviesDatabase;
  }
}

/**
 * יצירת prompt עבור Gemini לניתוח הודעות
 */
function createMoviePrompt(userMessage) {
  return `
אתה עוזר חכם לניתוח בקשות למלצות סרטים בעברית. נתח את ההודעה הבאה והחזר JSON מובנה.

זהה מהמשתמש:
1. ז'אנרים מועדפים (אקשן, קומדיה, דרמה, רומנטי, אימה, מתח, מדע בדיוני, פנטזיה, אנימציה וכו')
2. מצב רוח (עצוב, שמח, מרגש, רומנטי, מפחיד, נוסטלגי, משעשע וכו')
3. פלטפורמות זמינות (נטפליקס, יס, הוט)
4. גיל המשתמש או קהל היעד (7+, 13+, 17+)
5. משך זמן מועדף (קצר, בינוני, ארוך)
6. פקודות (אחרים/עוד, תודה, סיום/ביי)
7. שחקנים או במאים מועדפים

חשוב! תקן שגיאות כתיב ותבין כוונות גם אם הכתיב לא מדויק.

דוגמאות:
- "אני מחפש משהו מצחיק" → ז'אנר: קומדיה, מצב רוח: רוצה לצחוק
- "יש לי נטפליקס" → פלטפורמה: נטפליקס
- "בן 15" → גיל: 13+
- "משהו קצר לערב" → משך: קצר
- "עוד המלצות" → פקודה: אחרים

הודעת המשתמש: "${userMessage}"

החזר רק JSON בפורמט הבא:
{
  "genres": [],
  "mood": null,
  "platforms": [],
  "ageRange": null,
  "duration": null,
  "command": null,
  "actors": [],
  "directors": [],
  "isUnclear": false,
  "needsMoreInfo": null
}`;
}

/**
 * קריאה ל-Gemini API
 */
async function analyzeWithGemini(userMessage) {
  try {
    console.log("🤖 שולח ל-Gemini:", userMessage);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: createMoviePrompt(userMessage)
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API Error: ${response.status}`);
    }

    const result = await response.json();
    const geminiText = result.candidates[0].content.parts[0].text;
    
    console.log("🤖 תגובת Gemini:", geminiText);
    
    // חילוץ JSON
    const jsonMatch = geminiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in Gemini response');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    console.log("📊 ניתוח מובנה:", analysis);
    
    return analysis;
    
  } catch (error) {
    console.error("❌ שגיאה בניתוח Gemini:", error);
    
    // פתרון חלופי פשוט
    return analyzeBasicText(userMessage);
  }
}

/**
 * בדיקה אם ההודעה ברורה ומובנת
 */
function isUnclearText(text) {
  if (text.length < 2) return true;
  if (/^[\s\p{P}]+$/u.test(text)) return true;
  if (/^\d+$/.test(text)) return true;
  if (/^[א-ת]{1,2}$/.test(text)) return true;
  if (/^[^א-תa-zA-Z0-9\s]+$/.test(text)) return true;
  return false;
}

/**
 * בדיקת הבנה של תשובה לשאלה ספציפית
 */
function checkUnderstanding(message, questionId) {
  const lowerMessage = message.toLowerCase();

  switch(questionId) {
    case "genres":
      // בדיקה אם יש ז'אנרים מוכרים בהודעה
      const genreKeywords = ['אקשן', 'קומדיה', 'דרמה', 'רומנטי', 'אימה', 'מתח', 'מדע בדיוני', 'פנטזיה', 'אנימציה'];
      return genreKeywords.some(genre => lowerMessage.includes(genre)) || 
             lowerMessage.includes('מצחיק') || lowerMessage.includes('פעולה');
             
    case "age":
      // בדיקה אם יש אזכור גיל
      const hasNumbers = /\d+/.test(message);
      const ageKeywords = ["ילד", "נוער", "מבוגר", "בוגר", "משפחתי", "בן", "בת"];
      return hasNumbers || ageKeywords.some(keyword => lowerMessage.includes(keyword));
      
    case "duration":
      const durationKeywords = ["קצר", "בינוני", "ארוך", "זמן", "שעה", "דקות"];
      return durationKeywords.some(keyword => lowerMessage.includes(keyword));
      
    case "platforms":
      const platformKeywords = ["נטפליקס", "יס", "הוט", "כן", "לא", "אין"];
      return platformKeywords.some(keyword => lowerMessage.includes(keyword));
      
    default:
      return !isUnclearText(message);
  }
}

/**
 * קבלת השאלה הבאה שצריך לשאול
 */
function getNextQuestion() {
  const allInfoCollected = Object.values(conversationMemory.collectedInfo).every(info => info === true);
  if (allInfoCollected) {
    return null;
  }

  const questionOrder = ["genres", "age", "duration", "platforms"];
  
  for (const questionId of questionOrder) {
    if (!conversationMemory.collectedInfo[questionId]) {
      return interactiveQuestions.find(q => q.id === questionId);
    }
  }

  return null;
}
/**
 * ניתוח טקסט בסיסי כחלופה - משופר עם עדכון זיכרון
 */
function analyzeBasicText(text) {
  const lowerText = text.toLowerCase();
  
  const analysis = {
    genres: [],
    mood: null,
    platforms: [],
    ageRange: null,
    duration: null,
    command: null,
    actors: [],
    directors: [],
    isUnclear: false,
    needsMoreInfo: null
  };
  
  // זיהוי ז'אנרים
  if (lowerText.includes('קומדיה') || lowerText.includes('מצחיק')) analysis.genres.push('קומדיה');
  if (lowerText.includes('אקשן') || lowerText.includes('פעולה')) analysis.genres.push('אקשן');
  if (lowerText.includes('דרמה') || lowerText.includes('רגשי')) analysis.genres.push('דרמה');
  if (lowerText.includes('רומנטי') || lowerText.includes('אהבה')) analysis.genres.push('רומנטי');
  if (lowerText.includes('אימה') || lowerText.includes('מפחיד')) analysis.genres.push('אימה');
  
  // זיהוי מצבי רוח
  if (lowerText.includes('עצוב') || lowerText.includes('משעמם')) analysis.mood = 'עצוב';
  if (lowerText.includes('שמח') || lowerText.includes('טוב לי')) analysis.mood = 'שמח';
  if (lowerText.includes('רומנטי')) analysis.mood = 'רומנטי';
  
  // זיהוי פלטפורמות
  if (lowerText.includes('נטפליקס')) analysis.platforms.push('נטפליקס');
  if (lowerText.includes('יס')) analysis.platforms.push('יס');
  if (lowerText.includes('הוט')) analysis.platforms.push('הוט');
  
  // זיהוי גיל
  const ageMatch = lowerText.match(/(\d+)/);
  if (ageMatch) {
    const age = parseInt(ageMatch[1]);
    if (age >= 7 && age <= 12) analysis.ageRange = "7+";
    else if (age >= 13 && age <= 16) analysis.ageRange = "13+";
    else if (age >= 17) analysis.ageRange = "17+";
  }
  
  // זיהוי משך זמן
  if (lowerText.includes('קצר') || lowerText.includes('מהיר')) analysis.duration = 'קצר';
  if (lowerText.includes('בינוני')) analysis.duration = 'בינוני';
  if (lowerText.includes('ארוך')) analysis.duration = 'ארוך';
  
  // זיהוי פקודות
  if (lowerText.includes('עוד') || lowerText.includes('אחרים')) analysis.command = 'אחרים';
  if (lowerText.includes('תודה')) analysis.command = 'תודה';
  if (lowerText.includes('ביי') || lowerText.includes('להתראות')) analysis.command = 'סיום';
  
  return analysis;
}

/**
 * חיפוש סרטים לפי ניתוח - משופר עם זיכרון השיחה
 */
function findMoviesByAnalysis(analysis, movies) {
  let filtered = [...movies];
  
  console.log("🔍 מחפש סרטים לפי ניתוח:", analysis);
  console.log("🔍 מחפש סרטים לפי זיכרון:", conversationMemory);
  
  // שימוש בזיכרון השיחה במקום רק בניתוח הנוכחי
  const genresToSearch = conversationMemory.lastGenres.length > 0 ? 
                        conversationMemory.lastGenres : 
                        (analysis.genres || []);
  
  const platformsToSearch = conversationMemory.lastPlatforms.length > 0 ? 
                           conversationMemory.lastPlatforms : 
                           (analysis.platforms || []);
  
  const ageToSearch = conversationMemory.userPreferences.age || analysis.ageRange;
  const durationToSearch = conversationMemory.userPreferences.duration || analysis.duration;
  
  // סינון לפי ז'אנר
  if (genresToSearch.length > 0) {
    filtered = filtered.filter(movie => {
      const movieGenres = movie.Genres.toLowerCase();
      return genresToSearch.some(genre => {
        const englishGenre = translateGenreToEnglish(genre);
        return movieGenres.includes(englishGenre.toLowerCase());
      });
    });
    console.log(`🎭 אחרי סינון ז'אנר (${genresToSearch.join(', ')}):`, filtered.length);
  }
  
  // סינון לפי פלטפורמה
  if (platformsToSearch.length > 0) {
    filtered = filtered.filter(movie => 
      platformsToSearch.some(platform => movie[platform] === 1)
    );
    console.log(`📺 אחרי סינון פלטפורמה (${platformsToSearch.join(', ')}):`, filtered.length);
  }
  
  // סינון לפי גיל
  if (ageToSearch) {
    filtered = filtered.filter(movie => {
      if (!movie.ageRange) return true;
      if (ageToSearch === '17+') return true;
      if (ageToSearch === '13+' && ['7+', '13+'].includes(movie.ageRange)) return true;
      if (ageToSearch === '7+' && movie.ageRange === '7+') return true;
      return false;
    });
    console.log(`👥 אחרי סינון גיל (${ageToSearch}):`, filtered.length);
  }
  
  // סינון לפי משך זמן
  if (durationToSearch) {
    filtered = filtered.filter(movie => {
      const duration = movie.Duration || 0;
      if (durationToSearch === 'קצר') return duration <= 90;
      if (durationToSearch === 'בינוני') return duration > 90 && duration <= 120;
      if (durationToSearch === 'ארוך') return duration > 120;
      return true;
    });
    console.log(`⏰ אחרי סינון משך (${durationToSearch}):`, filtered.length);
  }
  
  // סינון לפי מצב רוח
  if (conversationMemory.lastMoods.length > 0) {
    const mood = conversationMemory.lastMoods[0];
    switch(mood) {
      case "עצוב":
        filtered = filtered.filter(movie => 
          movie.Genres.toLowerCase().includes("comedy")
        );
        break;
      case "רומנטי":
        filtered = filtered.filter(movie => 
          movie.Genres.toLowerCase().includes("romance")
        );
        break;
    }
    console.log(`😊 אחרי סינון מצב רוח (${mood}):`, filtered.length);
  }
  
  // מיון לפי דירוג
  filtered.sort((a, b) => (b.Rating || 0) - (a.Rating || 0));
  
  console.log(`🎯 סה"כ נמצאו ${filtered.length} סרטים`);
  return filtered;
}

/**
 * תרגום ז'אנר לאנגלית
 */
function translateGenreToEnglish(hebrewGenre) {
  const genreMap = {
    'אקשן': 'Action',
    'קומדיה': 'Comedy',
    'דרמה': 'Drama',
    'רומנטי': 'Romance',
    'אימה': 'Horror',
    'מתח': 'Thriller',
    'מדע בדיוני': 'Sci-Fi',
    'פנטזיה': 'Fantasy',
    'אנימציה': 'Animation',
    'תיעודי': 'Documentary',
    'ביוגרפיה': 'Biography',
    'היסטוריה': 'History',
    'מוזיקלי': 'Musical',
    'מערבון': 'Western',
    'פשע': 'Crime',
    'מסתורין': 'Mystery',
    'משפחה': 'Family',
    'ספורט': 'Sport',
    'מלחמה': 'War',
    'הרפתקה': 'Adventure'
  };
  
  return genreMap[hebrewGenre] || hebrewGenre;
}

/**
 * פורמט הצגת סרט
 */
function formatMovieRecommendation(movie) {
  const platforms = [];
  if (movie["נטפליקס"] === 1) platforms.push("נטפליקס");
  if (movie["יס"] === 1) platforms.push("יס");
  if (movie["הוט"] === 1) platforms.push("הוט");

  let trailerLinkHTML = '';
  if (movie.trailer) {
    trailerLinkHTML = `<br>🎥 <a href="${movie.trailer}" target="_blank" class="movie-link">צפה בטריילר</a>`;
  }

  let html = `🎬 <strong>"${movie.Title}"</strong> (${movie.Release_Year})<br>
🎭 ז'אנר: ${movie.Genres}<br>
⭐ דירוג IMDb: <strong>${movie.Rating}</strong><br>
🎬 במאי: ${movie.Director || 'לא צוין'}<br>
🌟 שחקנים: ${movie.Stars || 'לא צוין'}<br>
👥 גיל מומלץ: ${movie.ageRange || 'כל הגילאים'}<br>
⏰ משך: ${movie.Duration || 'לא צוין'} דקות<br>
📺 זמין ב: ${platforms.join(", ") || "לא צוינה פלטפורמה"}`;

  html += trailerLinkHTML;
  return html;
}

/**
 * יצירת תגובה חכמה עם מנגנון תשאול
 */
function generateSmartResponse(analysis, foundMovies, userMessage) {
  console.log("🔍 ניתוח נוכחי:", analysis);
  console.log("🧠 זיכרון לפני עדכון:", conversationMemory);
  
  // טיפול בפקודות מיוחדות
  if (analysis.command) {
    switch (analysis.command) {
      case 'תודה':
        return "תמיד בשמחה! 😊 אני כאן בשבילך מתי שתרצה המלצות נוספות! 🎬";
      case 'סיום':
        resetConversationMemory();
        return "תודה שהשתמשת באוסקר! 🎬 מקווה שתהנה מהסרט! עד הפעם הבאה! 👋";
      case 'אחרים':
        conversationMemory.recommendationOffset += 3;
        break;
    }
  }

  // עדכון זיכרון השיחה מניתוח Gemini או ניתוח בסיסי
  updateConversationMemory(analysis);
  
  console.log("🧠 זיכרון אחרי עדכון:", conversationMemory);
  
  // בדיקה אם יש מספיק מידע להמלצות
  const hasEnoughInfo = checkIfHasEnoughInfo();
  
  if (hasEnoughInfo) {
    conversationMemory.conversationState = "recommending";
    
    if (foundMovies && foundMovies.length > 0) {
      const moviesToShow = foundMovies.slice(conversationMemory.recommendationOffset, conversationMemory.recommendationOffset + 3);
      
      if (moviesToShow.length === 0) {
        conversationMemory.recommendationOffset = 0;
        return "זהו, הצגתי את כל הסרטים שמצאתי! אולי ננסה עם העדפות אחרות? 😉";
      }
      
      let response = analysis.command === 'אחרים' ? 
        "הנה עוד המלצות בשבילך:<br><br>" : 
        "מצאתי כמה סרטים מעולים בשבילך!<br><br>";
      
      moviesToShow.forEach((movie, index) => {
        response += `${conversationMemory.recommendationOffset + index + 1}. ${formatMovieRecommendation(movie)}<br><br>`;
      });
      
      if (foundMovies.length > (conversationMemory.recommendationOffset + 3)) {
        response += "רוצה עוד המלצות? פשוט תגיד 'עוד'! 😉";
      }
      
      return response;
    } else {
      // לא נמצאו סרטים - איפוס ושאלה מחדש
      resetConversationMemory();
      const nextQuestion = getNextQuestion();
      return "לא מצאתי סרטים שמתאימים בדיוק להעדפות שלך. בואי ננסה שוב!<br><br>" + 
             (nextQuestion ? nextQuestion.question : "מה מעניין אותך?");
    }
  } else {
    // עדיין צריך לאסוף מידע
    const nextQuestion = getNextQuestion();
    
    if (nextQuestion) {
      // בדיקה אם המשתמש ענה על השאלה הנוכחית
      if (conversationMemory.lastQuestion) {
        const understood = checkUnderstanding(userMessage, conversationMemory.lastQuestion);
        if (!understood && !isUnclearText(userMessage)) {
          return `לא בטוח שהבנתי. ${nextQuestion.question}`;
        }
      }
      
      conversationMemory.lastQuestion = nextQuestion.id;
      
      // יצירת תגובה מותאמת למידע שכבר נאסף
      let response = "";
      const providedInfo = getProvidedInfoSummary(analysis);
      
      if (providedInfo.length > 0) {
        response += `תודה על המידע בנוגע ל${providedInfo.join(' ו-')}! `;
      }
      
      response += `<br><br>${nextQuestion.question}`;
      return response;
    } else {
      return "אשמח לעזור לך למצוא סרט מושלם! מה מעניין אותך?";
    }
  }
}

/**
 * עדכון זיכרון השיחה לפי הניתוח
 */
function updateConversationMemory(analysis) {
  // עדכון ז'אנרים
  if (analysis.genres && analysis.genres.length > 0) {
    conversationMemory.lastGenres = analysis.genres;
    conversationMemory.collectedInfo.genres = true;
  }
  
  // עדכון מצב רוח
  if (analysis.mood) {
    conversationMemory.lastMoods = [analysis.mood];
    conversationMemory.collectedInfo.mood = true;
  }
  
  // עדכון פלטפורמות
  if (analysis.platforms && analysis.platforms.length > 0) {
    conversationMemory.lastPlatforms = analysis.platforms;
    conversationMemory.collectedInfo.platforms = true;
  }
  
  // עדכון גיל
  if (analysis.ageRange) {
    conversationMemory.userPreferences.age = analysis.ageRange;
    conversationMemory.collectedInfo.age = true;
  }
  
  // עדכון משך זמן
  if (analysis.duration) {
    conversationMemory.userPreferences.duration = analysis.duration;
    conversationMemory.collectedInfo.duration = true;
  }
  
  // עדכון שחקנים ובמאים
  if (analysis.actors && analysis.actors.length > 0) {
    conversationMemory.userPreferences.favoriteActors = analysis.actors;
  }
  
  if (analysis.directors && analysis.directors.length > 0) {
    conversationMemory.userPreferences.favoriteDirectors = analysis.directors;
  }
}

/**
 * בדיקה אם יש מספיק מידע להמלצות
 */
function checkIfHasEnoughInfo() {
  // לפחות ז'אנר אחד חובה
  const hasGenre = conversationMemory.collectedInfo.genres;
  
  // אופציונלי - פלטפורמה או גיל
  const hasOptionalInfo = conversationMemory.collectedInfo.platforms || 
                         conversationMemory.collectedInfo.age ||
                         conversationMemory.collectedInfo.duration;
  
  return hasGenre && hasOptionalInfo;
}

/**
 * סיכום המידע שסופק
 */
function getProvidedInfoSummary(analysis) {
  const provided = [];
  
  if (analysis.genres && analysis.genres.length > 0) provided.push("ז'אנר");
  if (analysis.mood) provided.push("מצב רוח");
  if (analysis.platforms && analysis.platforms.length > 0) provided.push("פלטפורמת צפייה");
  if (analysis.ageRange) provided.push("גיל");
  if (analysis.duration) provided.push("אורך סרט");
  
  return provided;
}

/**
 * איפוס זיכרון השיחה
 */
function resetConversationMemory() {
  conversationMemory = {
    lastGenres: [],
    lastMoods: [],
    lastPlatforms: [],
    lastRecommendations: [],
    lastQuestion: null,
    userPreferences: {
      age: null,
      duration: null,
      favoriteActors: [],
      favoriteDirectors: []
    },
    conversationState: "collecting_info",
    collectedInfo: {
      genres: false,
      age: false,
      mood: false,
      duration: false,
      platforms: false
    },
    recommendationOffset: 0
  };
}

/**
 * פונקציה לשליחת הודעה - עודכנה לגרסת GitHub
 */
async function sendMessage() {
  const input = document.getElementById("userInput");
  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  const convo = document.getElementById("conversation");

  // בדיקת פקודות מיוחדות
  if (isResetCommand(message)) {
    clearConversation(message);
    return;
  }

  if (isGreeting(message)) {
    addUserMessage(message);
    const welcomeResponse = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
    addBotMessage(welcomeResponse);
    return;
  }

  // הוספת הודעת המשתמש
  addUserMessage(message);
  
  // הוספת אנימציה של טעינה
  const loadingId = addLoadingMessage();

  try {
    // טעינת מאגר הסרטים
    const movies = await loadMoviesDatabase();
    
    // ניתוח ההודעה עם Gemini
    const analysis = await analyzeWithGemini(message);
    
    // חיפוש סרטים
    const foundMovies = findMoviesByAnalysis(analysis, movies);
    
    // יצירת תגובה
    const response = generateSmartResponse(analysis, foundMovies);
    
    // הסרת הודעת הטעינה והוספת התגובה
    removeLoadingMessage(loadingId);
    addBotMessage(response);
    
    // עדכון זיכרון
    conversationMemory.conversationHistory.push({
      user: message,
      analysis: analysis,
      foundMovies: foundMovies.length,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    removeLoadingMessage(loadingId);
    console.error("❌ שגיאה:", error);
    addBotMessage("אופס! משהו השתבש. בוא ננסה שוב? 🔧<br>אולי בדוק את חיבור האינטרנט.");
  }
}

// פונקציות עזר לממשק
function addUserMessage(message) {
  const convo = document.getElementById("conversation");
  convo.innerHTML += `<div class='bubble user'>${message}</div>`;
  convo.scrollTop = convo.scrollHeight;
}

function addBotMessage(message) {
  const convo = document.getElementById("conversation");
  convo.innerHTML += `<div class='bubble bot'>
    <img src="OSCARPIC.jpeg" alt="Oscar" class="bot-avatar">
    <div class="bot-message">${message}</div>
  </div>`;
  convo.scrollTop = convo.scrollHeight;
}

function addLoadingMessage() {
  const convo = document.getElementById("conversation");
  const loadingId = Date.now();
  convo.innerHTML += `<div class='bubble bot' id='loading-${loadingId}'>
    <img src="OSCARPIC.jpeg" alt="Oscar" class="bot-avatar">
    <div class="bot-message">🤖 מנתח את ההודעה עם AI...</div>
  </div>`;
  convo.scrollTop = convo.scrollHeight;
  return loadingId;
}

function removeLoadingMessage(loadingId) {
  const loadingElement = document.getElementById(`loading-${loadingId}`);
  if (loadingElement) loadingElement.remove();
}

function isGreeting(message) {
  const lowerMessage = message.toLowerCase();
  const greetings = ["היי", "שלום", "הי", "בוקר טוב", "ערב טוב"];
  return greetings.some(greeting => lowerMessage.includes(greeting));
}

function isResetCommand(message) {
  const lowerMessage = message.toLowerCase();
  const resetKeywords = ["התחל שיחה חדשה", "אפס", "חדש", "התחל מחדש"];
  return resetKeywords.some(keyword => lowerMessage.includes(keyword));
}

function clearConversation(userMessage = null) {
  const convo = document.getElementById("conversation");
  convo.innerHTML = '';
  
  // איפוס זיכרון השיחה
  resetConversationMemory();
  
  if (userMessage) {
    addUserMessage(userMessage);
  }

  const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  addBotMessage(randomWelcome);
}

// אתחול הדף
document.addEventListener('DOMContentLoaded', function() {
  console.log("🚀 אוסקר עם Gemini AI נטען (גרסת GitHub Pages)...");
  
  const input = document.getElementById("userInput");
  const convo = document.getElementById("conversation");
  
  if (!input || !convo) {
    console.error("❌ אלמנטים חיוניים לא נמצאו");
    return;
  }
  
  // הוספת מאזין לקלט
  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });
  
  // הודעת פתיחה
  const randomWelcome = welcomeMessages[Math.floor(Math.random() * welcomeMessages.length)];
  addBotMessage(randomWelcome);
  
  console.log("🎉 אוסקר מוכן לשימוש!");
});

// פונקציות נוספות לממשק
function checkConnection() {
  const statusElement = document.getElementById('connectionStatus');
  const statusIndicator = document.getElementById('statusIndicator');
  
  if (navigator.onLine) {
    statusElement.textContent = 'מחובר לאינטרנט 🟢';
    statusElement.className = 'connection-status connected';
    if (statusIndicator) statusIndicator.style.background = '#00d4aa';
  } else {
    statusElement.textContent = 'אין חיבור לאינטרנט 🔴';
    statusElement.className = 'connection-status disconnected';
    if (statusIndicator) statusIndicator.style.background = '#ff6b6b';
  }
}

function showHelp() {
  const helpMessage = `
    <strong>🎭 איך להשתמש באוסקר:</strong><br><br>
    • פשוט תגיד לי איזה סרט אתה מחפש<br>
    • למשל: "אני רוצה קומדיה מצחיקה"<br>
    • או: "יש לי נטפליקס, מה מומלץ?"<br>
    • אני מבין גם שגיאות כתיב!<br><br>
    <strong>🔧 פקודות שימושיות:</strong><br>
    • "עוד המלצות" - לקבלת סרטים נוספים<br>
    • "שיחה חדשה" - להתחלה מחדש<br>
    • "תודה" - לסיום השיחה<br><br>
    <em>אני כאן בשבילך! 😊</em>
  `;
  
  addBotMessage(helpMessage);
}

// בדיקת חיבור בעת טעינת הדף
window.addEventListener('load', function() {
  setTimeout(checkConnection, 1000);
});

// הוספת listener לשינוי מצב החיבור
window.addEventListener('online', checkConnection);
window.addEventListener('offline', checkConnection);
