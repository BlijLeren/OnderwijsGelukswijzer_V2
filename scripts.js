let quizData;
let currentQuestion = 0;
let choices = [];
let isNavigating = false; // Add this at the top with other variables

gsap.registerPlugin(ScrollTrigger);

// Add event listeners when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  // document.getElementById("start-button").addEventListener("click", startQuiz);

  document.getElementById("back-button").addEventListener("click", goBack);

  // Update event listeners to use data attributes instead of fixed options
  document.getElementById("option1").addEventListener("click", function () {
    const optionType = this.getAttribute("data-type");
    selectOption(optionType);
  });

  document.getElementById("option2").addEventListener("click", function () {
    const optionType = this.getAttribute("data-type");
    selectOption(optionType);
  });
});

//gsap
let path = document.querySelector(".transition1");

const start = "M 0 100 V 50 Q 50 0 100 50 V 100 z";
const end = "M 0 100 V 0 Q 50 0 100 0 V 100 z";

let tl = gsap.timeline();

tl.to(path, { attr: { d: start }, ease: "power2.in", duration: 0.5 })
  .to(path, { attr: { d: end }, ease: "power2.out", onComplete: startQuiz })
  .reverse();

document.getElementById("start-button").addEventListener("click", (e) => {
  const welcomeView = document.getElementById("welcome-view");
  welcomeView.style.opacity = "0"; // Add this line to trigger fade out
  tl.reversed(!tl.reversed());
});

// Remove this global GSAP animation
// gsap.to("#resultaatplaatje", {
//   scrollTrigger: {
//     trigger: "#resultaatplaatje",
//     start: "top center",
//     toggleActions: "play none none none",
//     markers: true,
//   },
//   x: 400,
//   rotation: 360,
//   duration: 3,
// });

fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    quizData = data.onderdelen;
  });

function startQuiz() {
  showView("quiz-view");
  currentQuestion = 0;
  choices = [];
  showQuestion();
}

function showQuestion() {
  const question = quizData[currentQuestion];

  // Modify theme setting to work on iOS
  const themeColors = {
    "Structuur": "#ffffff",
    "Nieuwsgierigheid": "#fff8e6",
    "Samenwerking": "#f0f7ff",
    "Motivatie": "#fff8e6"
  };
  
  document.body.style.backgroundColor = themeColors[question.thema];
  document.body.setAttribute("data-theme", question.thema);

  document.getElementById("progress").textContent = `${currentQuestion + 1}. ${
    question.onderdeelnaam
  }`;
  document.getElementById("current-topic").textContent = question.vraag;

  // Show/hide back button based on question number
  document.getElementById("back-button").style.display =
    currentQuestion > 0 ? "inline-block" : "none";

  // Randomly determine order
  const isReversed = Math.random() < 0.5;
  const options = document.querySelectorAll(".option");
  const types = isReversed ? ["Agora", "Regulier"] : ["Regulier", "Agora"];

  types.forEach((type, index) => {
    options[index].querySelector(".child-text").textContent =
      question.opties[type].kind;
    options[index].querySelector(".parent-text").textContent =
      question.opties[type].ouder;
    options[index].setAttribute("data-type", type); // Store the type for reference
  });
}

function selectOption(choice) {
  if (isNavigating) return;
  isNavigating = true;

  // Find selected option element by data-type attribute
  const optionElement = document.querySelector(
    `.option[data-type="${choice}"]`
  );

  optionElement.classList.add("clicking");
  setTimeout(() => optionElement.classList.remove("clicking"), 300);

  choices[currentQuestion] = choice;

  if (currentQuestion < quizData.length - 1) {
    currentQuestion++;
    showQuestion();
  } else {
    // Show loading screen first
    showView("loading-view");
    // Then show results after 1 second
    setTimeout(() => {
      showResults();
    }, 2000); //timeout for loading screen
  }

  setTimeout(() => (isNavigating = false), 300);
}

function goBack() {
  if (isNavigating || currentQuestion <= 0) return;
  isNavigating = true;

  currentQuestion--;
  choices.length = currentQuestion; // Remove choices after current question
  showQuestion();

  setTimeout(() => (isNavigating = false), 300);
}

function showResults() {
  showView("stats-view");

  // Initialize ScrollTrigger animation only after stats view is shown
  setTimeout(() => {
    gsap.to("#resultaatplaatje", {
      scrollTrigger: {
        trigger: "#resultaatplaatje",
        start: "top center",
        toggleActions: "play none none none",
        markers: true,
      },
      scale: 1,
      duration: 2,
      ease: "power1.inOut",
    });
  }, 100); // Small delay to ensure view transition is complete

  // Calculate overall stats
  const regulierCount = choices.filter((c) => c === "Regulier").length;
  const agoraCount = choices.filter((c) => c === "Agora").length;
  const total = choices.length;

  // Show overall percentages
  const regulierPercentage = Math.round((regulierCount / total) * 100);
  const agoraPercentage = Math.round((agoraCount / total) * 100);

  // Show/hide results based on percentages
  document.getElementById("Agoraresultaat").style.display =
    agoraPercentage > regulierPercentage ? "block" : "none";
  document.getElementById("Regulierresultaat").style.display =
    regulierPercentage >= agoraPercentage ? "block" : "none";

  document.getElementById(
    "regulier-stat"
  ).style.height = `${regulierPercentage}%`;
  document.getElementById("agora-stat").style.height = `${agoraPercentage}%`;
  document.getElementById(
    "regulier-percentage"
  ).textContent = `${regulierPercentage}%`;
  document.getElementById(
    "agora-percentage"
  ).textContent = `${agoraPercentage}%`;

  // Calculate theme stats
  const themes = ["Structuur", "Nieuwsgierigheid", "Samenwerking", "Motivatie"];
  themes.forEach((theme) => {
    const themeQuestions = quizData.filter((q) => q.thema === theme);
    const themeAnswers = themeQuestions
      .map((q) => choices[quizData.indexOf(q)])
      .filter((c) => c); // Filter out undefined answers

    if (themeAnswers.length > 0) {
      const themeAgora = themeAnswers.filter((c) => c === "Agora").length;
      const themePercentage = (themeAgora / themeAnswers.length) * 100;

      const percentElement = document.getElementById(
        `${theme.toLowerCase()}-percentage`
      );
      percentElement.style.left = `${themePercentage}%`;
      percentElement.innerHTML = `<span class="stat-value">${Math.round(
        themePercentage
      )}%</span>`;
    }
  });
}

function showView(viewId) {
  // Fade out all views
  document.querySelectorAll(".view").forEach((view) => {
    view.style.opacity = "0";
    setTimeout(() => {
      view.classList.remove("active");
    }, 10); // Match transition duration
  });

  // Fade in new view
  setTimeout(() => {
    const newView = document.getElementById(viewId);
    newView.classList.add("active");
    // Force a reflow to ensure transition happens
    newView.offsetHeight;
    newView.style.opacity = "1";
  }, 10);
}

function restartQuiz() {
  showView("welcome-view");
}
