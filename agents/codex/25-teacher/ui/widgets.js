(function () {
  const cohortsEl = document.getElementById("cohorts");
  const lessonsEl = document.getElementById("lessons");
  const practiceEl = document.getElementById("practice");

  const cohorts = [
    { name: "Builders", learners: 18, mastery: 0.81, lpj: 0.58 },
    { name: "Engineers", learners: 12, mastery: 0.87, lpj: 0.71 },
    { name: "Researchers", learners: 9, mastery: 0.9, lpj: 0.66 }
  ];

  const lessons = [
    { id: "L-PR-482", title: "ReflexBus: Publish & Subscribe", audience: "builders" },
    { id: "L-EP-73-2", title: "Memory as Graph", audience: "researchers" }
  ];

  const practiceSets = [
    { user: "sofia", mastery: 0.78, energy: 0.7, due: "2024-05-12T12:00:00Z" },
    { user: "amir", mastery: 0.86, energy: 1.0, due: "2024-05-12T15:00:00Z" }
  ];

  const renderCohorts = () => {
    const fragment = document.createElement("div");
    fragment.innerHTML = "<h2>Cohort Mastery</h2>";
    cohorts.forEach((cohort) => {
      const block = document.createElement("article");
      block.innerHTML = `
        <h3>${cohort.name}</h3>
        <dl>
          <dt>Learners</dt>
          <dd>${cohort.learners}</dd>
          <dt>Mastery</dt>
          <dd>${(cohort.mastery * 100).toFixed(1)}%</dd>
          <dt>Learning per Joule</dt>
          <dd>${cohort.lpj.toFixed(2)}</dd>
        </dl>`;
      fragment.appendChild(block);
    });
    cohortsEl.appendChild(fragment);
  };

  const renderLessons = () => {
    const list = document.createElement("div");
    list.innerHTML = "<h2>Recent Lessons</h2>";
    lessons.forEach((lesson) => {
      const item = document.createElement("p");
      item.innerHTML = `<strong>${lesson.title}</strong> <span class="tag">${lesson.audience}</span>`;
      list.appendChild(item);
    });
    lessonsEl.appendChild(list);
  };

  const renderPractice = () => {
    const list = document.createElement("div");
    list.innerHTML = "<h2>Next Practice Sets</h2>";
    practiceSets.forEach((practice) => {
      const item = document.createElement("p");
      item.innerHTML = `@${practice.user} → Mastery ${(practice.mastery * 100).toFixed(0)}%, Energy ${practice.energy}J, Review by ${new Date(practice.due).toLocaleString()}`;
      list.appendChild(item);
    });
    practiceEl.appendChild(list);
  };

  renderCohorts();
  renderLessons();
  renderPractice();
})();
