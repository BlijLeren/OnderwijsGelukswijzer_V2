let quizData;
let currentQuestion = 0;
let choices = [];
let isNavigating = false; // Add this at the top with other variables
let sliderInstances = new Map(); // Add this with other global variables at the top

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

  // Set theme attribute on body
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

  populateStructuurSlider(); // <-- Call the function here
  populateNieuwsgierigheidSlider();
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

  setTimeout(() => {
    gsap.to("#resultaatplaatje", {
      scrollTrigger: {
        trigger: "#resultaatplaatje",
        start: "top center",
        toggleActions: "play none none none",
        markers: true,
      },
      scale: 1,
      duration: 1.5,
      ease: "power3.out",
    });
    gsap.to(".Resultaatsvg", {
      scrollTrigger: {
        trigger: "#resultaatplaatje",
        start: "top center",
        toggleActions: "play none none none",
        markers: true,
      },
      scale: 1,
      rotation: 360,
      duration: 2,
      ease: "power3.out",
    });
  }, 50);
}

//GSAP Cards
function initializeSlider(sliderElement) {
  // Cleanup existing instance if it exists
  if (sliderInstances.has(sliderElement)) {
    sliderInstances.get(sliderElement).kill();
    sliderInstances.delete(sliderElement);
  }

  const slides = gsap.utils.toArray(sliderElement.querySelectorAll(".slide"));
  const snapPoints = slides.map((slide, i) => -(slide.offsetWidth + 16) * i);
  const mySnap = gsap.utils.snap(snapPoints);

  const instance = Draggable.create(sliderElement, {
    type: "x",
    bounds: {
      maxX: 0,
      minX: window.innerWidth - sliderElement.scrollWidth - 50,
    },
    inertia: true,
    snap: {
      x: (v) => mySnap(v),
    },
  })[0];

  sliderInstances.set(sliderElement, instance);
  return instance;
}

// Call initializeSlider after populating the slides
function populateStructuurSlider() {
  const structuurQuestions = quizData.filter((q) => q.thema === "Structuur");
  const slider = document.getElementById("structuur-slider");

  // Clear existing slides
  slider.innerHTML = "";

  structuurQuestions.forEach((question, index) => {
    const choice = choices[quizData.indexOf(question)];
    if (choice) {
      const otherChoice = choice === "Regulier" ? "Agora" : "Regulier";
      const slide = document.createElement("div");
      slide.className = `slide ${choice.toLowerCase()}`;
      slide.innerHTML = `
        <div class="slide-header">
          <div class="slide-title">${question.onderdeelnaam}</div>
        </div>
        <div class="slide-content active" data-type="${choice}">
          <div class="slide-choice">${question.opties[choice].kind}</div>
          <div class="slide-choice">${question.opties[choice].ouder}</div>
        </div>
        <div class="slide-content" data-type="${otherChoice}">
          <div class="slide-choice">${question.opties[otherChoice].kind}</div>
          <div class="slide-choice">${question.opties[otherChoice].ouder}</div>
        </div>
        <button class="toggle-btn" title="Wissel antwoord">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <path d="M8.22673 13.3292C8.51492 14.1471 9.06116 14.8493 9.78313 15.3298C10.5051 15.8103 11.3637 16.0432 12.2296 15.9934C13.0954 15.9436 13.9216 15.6137 14.5837 15.0535C15.2458 14.4933 15.7078 13.7332 15.9003 12.8876C16.0927 12.042 16.0051 11.1567 15.6507 10.3652C15.2962 9.57374 14.6941 8.91887 13.9351 8.4993C13.176 8.07974 12.3012 7.91819 11.4424 8.03902C10.0777 8.23101 9.0827 9.23345 8 10M8 10V7M8 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      `;
      slider.appendChild(slide);

      // Add toggle functionality
      const toggleBtn = slide.querySelector(".toggle-btn");
      const contents = slide.querySelectorAll(".slide-content");

      // Set initial perspective
      slide.style.perspective = "1000px";
      slide.querySelector(".slide-content.active").style.backfaceVisibility =
        "hidden";

      toggleBtn.addEventListener("click", () => {
        // Prevent multiple clicks during animation
        if (toggleBtn.disabled) return;
        toggleBtn.disabled = true;

        // First half of flip
        gsap.to(slide, {
          rotationX: 90,
          duration: 0.3,
          ease: "power1.Out",
          onComplete: () => {
            // Switch content at midpoint of flip
            contents.forEach((content) => content.classList.toggle("active"));
            slide.className = `slide ${
              slide.classList.contains("regulier") ? "agora" : "regulier"
            }`;

            // Second half of flip
            gsap.to(slide, {
              rotationX: 0,
              duration: 0.3,
              ease: "power1.Out",
              onComplete: () => {
                toggleBtn.disabled = false;
              },
            });
          },
        });
      });
    }
  });

  // Replace the setTimeout at the end with:
  setTimeout(() => {
    const slider = document.getElementById("structuur-slider");
    initializeSlider(slider);
  }, 100);
}

function populateNieuwsgierigheidSlider() {
  const NieuwsgierigheidQuestions = quizData.filter(
    (q) => q.thema === "Nieuwsgierigheid"
  );
  const slider = document.getElementById("Nieuwsgierigheid-slider");

  // Clear existing slides
  slider.innerHTML = "";

  NieuwsgierigheidQuestions.forEach((question, index) => {
    const choice = choices[quizData.indexOf(question)];
    if (choice) {
      const otherChoice = choice === "Regulier" ? "Agora" : "Regulier";
      const slide = document.createElement("div");
      slide.className = `slide ${choice.toLowerCase()}`;
      slide.innerHTML = `
        <div class="slide-header">
          <div class="slide-title">${question.onderdeelnaam}</div>
        </div>
        <div class="slide-content active" data-type="${choice}">
          <div class="slide-choice">${question.opties[choice].kind}</div>
          <div class="slide-choice">${question.opties[choice].ouder}</div>
        </div>
        <div class="slide-content" data-type="${otherChoice}">
          <div class="slide-choice">${question.opties[otherChoice].kind}</div>
          <div class="slide-choice">${question.opties[otherChoice].ouder}</div>
        </div>
        <button class="toggle-btn" title="Wissel antwoord">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <path d="M8.22673 13.3292C8.51492 14.1471 9.06116 14.8493 9.78313 15.3298C10.5051 15.8103 11.3637 16.0432 12.2296 15.9934C13.0954 15.9436 13.9216 15.6137 14.5837 15.0535C15.2458 14.4933 15.7078 13.7332 15.9003 12.8876C16.0927 12.042 16.0051 11.1567 15.6507 10.3652C15.2962 9.57374 14.6941 8.91887 13.9351 8.4993C13.176 8.07974 12.3012 7.91819 11.4424 8.03902C10.0777 8.23101 9.0827 9.23345 8 10M8 10V7M8 10H11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </button>
      `;
      slider.appendChild(slide);

      // Add toggle functionality
      const toggleBtn = slide.querySelector(".toggle-btn");
      const contents = slide.querySelectorAll(".slide-content");

      // Set initial perspective
      slide.style.perspective = "1000px";
      slide.querySelector(".slide-content.active").style.backfaceVisibility =
        "hidden";

      toggleBtn.addEventListener("click", () => {
        // Prevent multiple clicks during animation
        if (toggleBtn.disabled) return;
        toggleBtn.disabled = true;

        // First half of flip
        gsap.to(slide, {
          rotationX: 90,
          duration: 0.3,
          ease: "power1.Out",
          onComplete: () => {
            // Switch content at midpoint of flip
            contents.forEach((content) => content.classList.toggle("active"));
            slide.className = `slide ${
              slide.classList.contains("regulier") ? "agora" : "regulier"
            }`;

            // Second half of flip
            gsap.to(slide, {
              rotationX: 0,
              duration: 0.3,
              ease: "power1.Out",
              onComplete: () => {
                toggleBtn.disabled = false;
              },
            });
          },
        });
      });
    }
  });

  // Replace the setTimeout at the end with:
  setTimeout(() => {
    const slider = document.getElementById("Nieuwsgierigheid-slider");
    initializeSlider(slider);
  }, 100);
}

//gsap cards end

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
