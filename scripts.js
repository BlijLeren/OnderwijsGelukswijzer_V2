let quizData;
let currentQuestion = 0;
let choices = [];
let isNavigating = false; // Add this at the top with other variables

gsap.registerPlugin(ScrollTrigger);
gsap.registerPlugin(SplitText);
gsap.registerPlugin(Draggable, InertiaPlugin);

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

  // Add event listener for quiz intro next button
  document
    .querySelector("#quiz_intro .next-intro-button")
    .addEventListener("click", () => {
      document.getElementById("quiz_intro").style.display = "none";
      document.getElementById("quiz-content").style.display = "block";
      showQuestion();
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

  // Hide quiz content and show initial quiz intro
  document.getElementById("quiz-content").style.display = "none";
  document.getElementById("quiz_intro").style.display = "block";
  document.body.setAttribute("data-theme", "quiz_intro");
}

function showQuestion() {
  const question = quizData[currentQuestion];

  // Check if this is an intro question for a theme
  if (question.introquestion === "yes") {
    const themeNum = question.themanummer.replace("thema", "");
    showThemePopup(themeNum);
  }

  // Set theme attribute on body using themanummer instead of thema
  document.body.setAttribute("data-theme", question.themanummer);

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

// Add this to the showResults function, before the GSAP animations
function showResults() {
  showView("stats-view");

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

  // Show/hide corresponding FAQ section
  document.getElementById("Agora-FAQ").style.display =
    agoraPercentage > regulierPercentage ? "block" : "none";
  document.getElementById("Regulier-FAQ").style.display =
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

  // Update theme stats calculation to use themanummer
  const themes = ["thema1", "thema2", "thema3", "thema4"];
  themes.forEach((theme) => {
    const themeQuestions = quizData.filter((q) => q.themanummer === theme);
    const themeAnswers = themeQuestions
      .map((q) => choices[quizData.indexOf(q)])
      .filter((c) => c);

    if (themeAnswers.length > 0) {
      const themeAgora = themeAnswers.filter((c) => c === "Agora").length;
      const themePercentage = (themeAgora / themeAnswers.length) * 100;

      const percentElement = document.getElementById(`${theme}-percentage`);
      percentElement.style.left = `${themePercentage}%`;
      percentElement.innerHTML = `<span class="stat-value">${Math.round(
        themePercentage
      )}%</span>`;
    }
  });

  // GSAP animations

  // console.clear();

  // document.fonts.ready.then(() => {
  //   let split;
  //   gsap.set(".split", { opacity: 1 });

  //   SplitText.create(".split", {
  //     type: "lines, words",
  //     autoSplit: true,
  //     mask: "lines",
  //     onSplit: (self) => {
  //       gsap.from(self.words, {
  //         yPercent: 20,
  //         opacity: 0,
  //         stagger: 0.02,
  //       });
  //       return split;
  //     },
  //   });
  // });

  //GSAP

  var tl = gsap.timeline(),
    mySplitText = new SplitText(".split", { type: "words,chars" }),
    chars = mySplitText.chars;

  tl.from(chars, {
    duration: 0.3,
    opacity: 0,
    scale: 0,
    y: 80,
    rotationX: 150,
    transformOrigin: "0% 50% -50",
    ease: "power3.out",
    stagger: 0.005,
  });

  var t2 = gsap.timeline(),
    mySplitText = new SplitText(".split2", { type: "words,chars" }),
    chars2 = mySplitText.chars;

  t2.from(chars2, {
    duration: 1.5,
    opacity: 0,
    scale: 0,
    y: 80,
    rotationX: 150,
    transformOrigin: "0% 50% -50",
    ease: "power3.out",
    stagger: 0.005,
  });

  setTimeout(() => {
    gsap.to("#resultaatplaatje", {
      scrollTrigger: {
        trigger: ".split2",
        start: "top center",
        toggleActions: "play none none none",
        markers: false,
      },
      scale: 1,
      duration: 1.5,
      ease: "power3.out",
    });
    gsap.to(".Resultaatsvg", {
      scrollTrigger: {
        trigger: ".split2",
        start: "top center",
        toggleActions: "play none none none",
        markers: false,
      },
      scale: 1,
      ease: "power3.out",
    });
  }, 50);
}

// GSAP end

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

function showThemePopup(themeNum) {
  const overlay = document.createElement("div");
  overlay.className = "theme-popup-overlay";
  document.body.appendChild(overlay);

  const popup = document.createElement("div");
  popup.className = "theme-popup";
  const content = document.getElementById(`thema${themeNum}_intro`).innerHTML;
  popup.innerHTML = content;

  // Get the original button
  const originalButton = popup.querySelector(".next-intro-button");
  const originalText = originalButton.textContent;

  // Replace with new button but keep the text
  const closeButton = document.createElement("button");
  closeButton.className = "next-intro-button";
  closeButton.textContent = originalText;

  closeButton.onclick = () => {
    popup.classList.remove("active");
    overlay.classList.remove("active");
    setTimeout(() => {
      popup.remove();
      overlay.remove();
    }, 800); // Match transition duration
  };

  // Replace old button with new one
  originalButton.replaceWith(closeButton);

  document.body.appendChild(popup);

  // Force reflow and add active class
  popup.offsetHeight;
  popup.classList.add("active");
  overlay.classList.add("active");
}
