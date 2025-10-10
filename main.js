// Données en mémoire
let structures = [];
let factures = [];
let quartiers = [];
let currentEditStructure = null;
let currentEditFacture = null;
let currentEditQuartier = null;
let currentArticles = [];

// Initialisation de l'application
document.addEventListener("DOMContentLoaded", function () {
  loadData();
  updateDashboard();
  renderStructures();
  renderFactures();
  renderQuartiers();
  updateStructureSelect();
  updateAllQuartiersSelects();
});

// Gestion des données (simulation localStorage)
function loadData() {
  // Charger depuis localStorage si disponible
  const savedStructures = localStorage.getItem("structures");
  const savedFactures = localStorage.getItem("factures");
  const savedQuartiers = localStorage.getItem("quartiers");

  // Charger les quartiers
  if (savedQuartiers) {
    quartiers = JSON.parse(savedQuartiers);
  } else {
    // Quartiers par défaut pour Abidjan
    quartiers = [
      { id: 1, nom: "Cocody" },
      { id: 2, nom: "Plateau" },
      { id: 3, nom: "Adjamé" },
      { id: 4, nom: "Yopougon" },
      { id: 5, nom: "Marcory" },
      { id: 6, nom: "Abobo" },
      { id: 7, nom: "Koumassi" },
      { id: 8, nom: "Treichville" },
    ];
    // Afficher un message d'information
    setTimeout(() => {
      if (
        confirm(
          "Bienvenue ! Les quartiers d'Abidjan sont chargés par défaut.\n\nVoulez-vous les personnaliser maintenant ?"
        )
      ) {
        switchTab("configuration");
      }
    }, 500);
  }

  if (savedStructures) {
    structures = JSON.parse(savedStructures);
  } else {
    structures = [
      {
        id: 1,
        nom: "Restaurant Le Palmier",
        quartier: "Cocody",
        adresse: "Rue des Jardins",
        telephone: "+225 01 02 03 04 05",
        email: "contact@lepalmier.com",
      },
      {
        id: 2,
        nom: "Hôtel Étoile d'Or",
        quartier: "Plateau",
        adresse: "Avenue Chardy",
        telephone: "+225 07 08 09 10 11",
        email: "info@etoiledor.com",
      },
    ];
  }

  if (savedFactures) {
    factures = JSON.parse(savedFactures);
  } else {
    factures = [
      {
        id: 1,
        structureId: 1,
        numero: "FACT-001",
        description: "Services de restauration - Septembre 2025",
        articles: [
          {
            designation: "Menu déjeuner",
            quantite: 50,
            prixUnitaire: 5000,
            total: 250000,
          },
          {
            designation: "Menu dîner",
            quantite: 30,
            prixUnitaire: 7000,
            total: 210000,
          },
        ],
        montant: 460000,
        tva: 18,
        remise: 0,
        notes: "Paiement sous 30 jours",
        dateEmission: "2025-09-01",
        dateEcheance: "2025-10-01",
        statut: "payée",
      },
      {
        id: 2,
        structureId: 1,
        numero: "FACT-002",
        description: "Fournitures et services - Octobre 2025",
        articles: [
          {
            designation: "Service traiteur",
            quantite: 1,
            prixUnitaire: 750000,
            total: 750000,
          },
        ],
        montant: 750000,
        tva: 18,
        remise: 0,
        notes: "",
        dateEmission: "2025-10-01",
        dateEcheance: "2025-11-01",
        statut: "impayée",
      },
    ];
  }
}

function saveData() {
  localStorage.setItem("structures", JSON.stringify(structures));
  localStorage.setItem("factures", JSON.stringify(factures));
  localStorage.setItem("quartiers", JSON.stringify(quartiers));
}

// Gestion des onglets
function switchTab(tabName) {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.classList.remove("active");
  });
  document.querySelectorAll(".tab-content").forEach((content) => {
    content.classList.remove("active");
  });

  const clickedButton = Array.from(document.querySelectorAll(".tab-btn")).find(
    (btn) => btn.getAttribute("onclick").includes(tabName)
  );
  if (clickedButton) clickedButton.classList.add("active");

  document.getElementById(tabName).classList.add("active");

  if (tabName === "dashboard") {
    updateDashboard();
  } else if (tabName === "structures") {
    renderStructures();
  } else if (tabName === "factures") {
    renderFactures();
  } else if (tabName === "configuration") {
    renderQuartiers();
  }
}

// GESTION DES QUARTIERS
function showQuartierForm() {
  currentEditQuartier = null;
  document.getElementById("quartierForm").classList.add("active");
  document.getElementById("quartierNom").value = "";
  document.getElementById("quartierNom").focus();
}

function cancelQuartierForm() {
  document.getElementById("quartierForm").classList.remove("active");
  currentEditQuartier = null;
}

function saveQuartier() {
  const nomInput = document.getElementById("quartierNom");

  if (!nomInput) {
    console.error("Élément quartierNom introuvable");
    alert("Erreur: formulaire non trouvé. Rechargez la page.");
    return;
  }

  const nom = nomInput.value.trim();

  if (!nom) {
    alert("Veuillez entrer le nom du quartier");
    nomInput.focus();
    return;
  }

  // Vérifier les doublons
  const existe = quartiers.find(
    (q) =>
      q.nom.toLowerCase() === nom.toLowerCase() && q.id !== currentEditQuartier
  );

  if (existe) {
    alert("Ce quartier existe déjà !");
    nomInput.focus();
    return;
  }

  if (currentEditQuartier) {
    // Modification
    const index = quartiers.findIndex((q) => q.id === currentEditQuartier);
    const oldNom = quartiers[index].nom;
    quartiers[index].nom = nom;

    // Mettre à jour les structures qui utilisent ce quartier
    structures.forEach((s) => {
      if (s.quartier === oldNom) {
        s.quartier = nom;
      }
    });
  } else {
    // Création
    const newQuartier = {
      id:
        quartiers.length > 0 ? Math.max(...quartiers.map((q) => q.id)) + 1 : 1,
      nom,
    };
    quartiers.push(newQuartier);
    console.log("Nouveau quartier ajouté:", newQuartier);
  }

  saveData();
  cancelQuartierForm();
  renderQuartiers();
  updateAllQuartiersSelects();
  updateDashboard();

  alert(
    `Quartier "${nom}" ${
      currentEditQuartier ? "modifié" : "ajouté"
    } avec succès !`
  );
}

function editQuartier(id) {
  const quartier = quartiers.find((q) => q.id === id);
  if (!quartier) return;

  currentEditQuartier = id;
  document.getElementById("quartierForm").classList.add("active");
  document.getElementById("quartierNom").value = quartier.nom;
  document
    .getElementById("quartierForm")
    .scrollIntoView({ behavior: "smooth" });
}

function deleteQuartier(id) {
  const quartier = quartiers.find((q) => q.id === id);
  if (!quartier) return;

  // Vérifier si des structures utilisent ce quartier
  const structuresUtilisant = structures.filter(
    (s) => s.quartier === quartier.nom
  );

  if (structuresUtilisant.length > 0) {
    alert(
      `Impossible de supprimer "${quartier.nom}".\n\n${structuresUtilisant.length} structure(s) utilisent ce quartier.\n\nVeuillez d'abord réassigner ou supprimer ces structures.`
    );
    return;
  }

  if (
    !confirm(
      `Êtes-vous sûr de vouloir supprimer le quartier "${quartier.nom}" ?`
    )
  ) {
    return;
  }

  quartiers = quartiers.filter((q) => q.id !== id);

  saveData();
  renderQuartiers();
  updateAllQuartiersSelects();
  updateDashboard();
}

function renderQuartiers() {
  const quartiersList = document.getElementById("quartiersList");

  if (quartiers.length === 0) {
    quartiersList.innerHTML =
      '<p style="text-align: center; color: #718096; padding: 40px;">Aucun quartier configuré. Ajoutez votre premier quartier !</p>';
    return;
  }

  quartiersList.innerHTML = quartiers
    .map((quartier) => {
      const nbStructures = structures.filter(
        (s) => s.quartier === quartier.nom
      ).length;
      const facturesQuartier = factures.filter((f) => {
        const structure = structures.find((s) => s.id === f.structureId);
        return structure && structure.quartier === quartier.nom;
      });
      const nbFactures = facturesQuartier.length;

      return `
            <div class="structure-card">
                <div class="structure-header">
                    <div>
                        <div class="structure-name">📍 ${quartier.nom}</div>
                        <div class="structure-info" style="margin-top: 10px;">
                            <strong>${nbStructures}</strong> structure(s) • <strong>${nbFactures}</strong> facture(s)
                        </div>
                    </div>
                    <div>
                        <button class="btn-edit" onclick="editQuartier(${quartier.id})">✏️ Modifier</button>
                        <button class="btn-delete" onclick="deleteQuartier(${quartier.id})">🗑️ Supprimer</button>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

function updateAllQuartiersSelects() {
  // Mettre à jour tous les selects de quartiers dans l'application
  const selects = [
    document.getElementById("structureQuartier"),
    document.getElementById("filterQuartier"),
  ];

  selects.forEach((select) => {
    if (!select) return;

    const currentValue = select.value;
    const isFilter = select.id === "filterQuartier";

    select.innerHTML =
      (isFilter
        ? '<option value="">Tous les quartiers</option>'
        : '<option value="">Sélectionner un quartier</option>') +
      quartiers
        .map((q) => `<option value="${q.nom}">${q.nom}</option>`)
        .join("");

    // Restaurer la valeur sélectionnée si elle existe encore
    if (currentValue && quartiers.find((q) => q.nom === currentValue)) {
      select.value = currentValue;
    }
  });
}

function resetToDefaultQuartiers() {
  if (
    !confirm(
      "Êtes-vous sûr de vouloir réinitialiser avec les quartiers d'Abidjan par défaut ?\n\nCela supprimera vos quartiers personnalisés (mais pas vos structures et factures)."
    )
  ) {
    return;
  }

  quartiers = [
    { id: 1, nom: "Cocody" },
    { id: 2, nom: "Plateau" },
    { id: 3, nom: "Adjamé" },
    { id: 4, nom: "Yopougon" },
    { id: 5, nom: "Marcory" },
    { id: 6, nom: "Abobo" },
    { id: 7, nom: "Koumassi" },
    { id: 8, nom: "Treichville" },
  ];

  saveData();
  renderQuartiers();
  updateAllQuartiersSelects();
  updateDashboard();

  alert("Quartiers réinitialisés avec succès !");
}

// DASHBOARD
function updateDashboard() {
  const quartiers = [...new Set(structures.map((s) => s.quartier))];
  const dashboardGrid = document.getElementById("dashboardGrid");

  if (quartiers.length === 0) {
    dashboardGrid.innerHTML =
      '<p style="text-align: center; color: #718096; padding: 40px;">Aucune structure enregistrée. Ajoutez des structures pour voir les statistiques.</p>';
    return;
  }

  dashboardGrid.innerHTML = quartiers
    .map((quartier) => {
      const structuresQuartier = structures.filter(
        (s) => s.quartier === quartier
      );
      const facturesQuartier = factures.filter((f) => {
        const structure = structures.find((s) => s.id === f.structureId);
        return structure && structure.quartier === quartier;
      });

      const totalFactures = facturesQuartier.length;
      const montantTotal = facturesQuartier.reduce(
        (sum, f) => sum + f.montant,
        0
      );
      const montantImpaye = facturesQuartier
        .filter((f) => f.statut !== "payée")
        .reduce((sum, f) => sum + f.montant, 0);
      const facturesEnRetard = facturesQuartier.filter(
        (f) => f.statut === "en retard"
      ).length;

      return `
            <div class="quartier-card" onclick="showQuartierFactures('${quartier}')" style="cursor: pointer;">
                <h3>📍 ${quartier}</h3>
                <div class="stat-row">
                    <span class="stat-label">Structures:</span>
                    <span class="stat-value">${structuresQuartier.length}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total factures:</span>
                    <span class="stat-value">${totalFactures}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Montant total:</span>
                    <span class="stat-value montant-total">${formatMontant(
                      montantTotal
                    )} FCFA</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Montant impayé:</span>
                    <span class="stat-value montant-impaye">${formatMontant(
                      montantImpaye
                    )} FCFA</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Factures en retard:</span>
                    <span class="stat-value" style="color: #dc3545;">${facturesEnRetard}</span>
                </div>
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <span style="color: #4c51bf; font-weight: 600; font-size: 0.9em;">👁️ Cliquer pour voir les factures</span>
                </div>
            </div>
        `;
    })
    .join("");
}

function showQuartierFactures(quartier) {
  // Filtrer les factures du quartier
  const facturesQuartier = factures.filter((f) => {
    const structure = structures.find((s) => s.id === f.structureId);
    return structure && structure.quartier === quartier;
  });

  if (facturesQuartier.length === 0) {
    alert(`Aucune facture trouvée pour le quartier ${quartier}`);
    return;
  }

  // Calculer les statistiques
  const montantTotal = facturesQuartier.reduce((sum, f) => sum + f.montant, 0);
  const montantPaye = facturesQuartier
    .filter((f) => f.statut === "payée")
    .reduce((sum, f) => sum + f.montant, 0);
  const montantImpaye = facturesQuartier
    .filter((f) => f.statut !== "payée")
    .reduce((sum, f) => sum + f.montant, 0);

  // Créer une fenêtre modale
  const modal = document.createElement("div");
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 1000;
        padding: 20px;
    `;

  const modalContent = document.createElement("div");
  modalContent.style.cssText = `
        background: white;
        border-radius: 15px;
        padding: 30px;
        max-width: 1200px;
        max-height: 90vh;
        overflow-y: auto;
        width: 100%;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    `;

  modalContent.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 3px solid #4c51bf; padding-bottom: 15px;">
            <h2 style="color: #4c51bf; margin: 0;">📍 Factures du quartier ${quartier}</h2>
            <button onclick="this.closest('[style*=fixed]').remove()" style="background: #e53e3e; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; font-size: 1.1em; font-weight: 600;">✖ Fermer</button>
        </div>

        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 25px; background: #f7fafc; padding: 20px; border-radius: 10px;">
            <div>
                <div style="color: #718096; font-size: 0.9em; margin-bottom: 5px;">Total factures</div>
                <div style="font-size: 1.5em; font-weight: 700; color: #2d3748;">${
                  facturesQuartier.length
                }</div>
            </div>
            <div>
                <div style="color: #718096; font-size: 0.9em; margin-bottom: 5px;">Montant total</div>
                <div style="font-size: 1.5em; font-weight: 700; color: #4c51bf;">${formatMontant(
                  montantTotal
                )} FCFA</div>
            </div>
            <div>
                <div style="color: #718096; font-size: 0.9em; margin-bottom: 5px;">Montant payé</div>
                <div style="font-size: 1.5em; font-weight: 700; color: #28a745;">${formatMontant(
                  montantPaye
                )} FCFA</div>
            </div>
            <div>
                <div style="color: #718096; font-size: 0.9em; margin-bottom: 5px;">Montant impayé</div>
                <div style="font-size: 1.5em; font-weight: 700; color: #dc3545;">${formatMontant(
                  montantImpaye
                )} FCFA</div>
            </div>
        </div>

        <table style="width: 100%; border-collapse: collapse;">
            <thead style="background: #4c51bf; color: white;">
                <tr>
                    <th style="padding: 12px; text-align: left;">Numéro</th>
                    <th style="padding: 12px; text-align: left;">Structure</th>
                    <th style="padding: 12px; text-align: left;">Description</th>
                    <th style="padding: 12px; text-align: right;">Montant</th>
                    <th style="padding: 12px; text-align: center;">Date émission</th>
                    <th style="padding: 12px; text-align: center;">Date échéance</th>
                    <th style="padding: 12px; text-align: center;">Statut</th>
                    <th style="padding: 12px; text-align: center;">Actions</th>
                </tr>
            </thead>
            <tbody>
                ${facturesQuartier
                  .sort(
                    (a, b) =>
                      new Date(b.dateEmission) - new Date(a.dateEmission)
                  )
                  .map((facture) => {
                    const structure = structures.find(
                      (s) => s.id === facture.structureId
                    );
                    const statusClass =
                      facture.statut === "payée"
                        ? "status-payee"
                        : facture.statut === "en retard"
                        ? "status-retard"
                        : "status-impayee";

                    return `
                        <tr style="border-bottom: 1px solid #e2e8f0;">
                            <td style="padding: 12px;"><strong>${
                              facture.numero
                            }</strong></td>
                            <td style="padding: 12px;">${
                              structure ? structure.nom : "N/A"
                            }</td>
                            <td style="padding: 12px; max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${facture.description || "-"}
                            </td>
                            <td style="padding: 12px; text-align: right;"><strong>${formatMontant(
                              facture.montant
                            )} FCFA</strong></td>
                            <td style="padding: 12px; text-align: center;">${formatDate(
                              facture.dateEmission
                            )}</td>
                            <td style="padding: 12px; text-align: center;">${formatDate(
                              facture.dateEcheance
                            )}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="status-badge ${statusClass}">${capitalizeFirst(
                      facture.statut
                    )}</span>
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                <button class="btn-edit" onclick="event.stopPropagation(); viewFacture(${
                                  facture.id
                                })" title="Voir/Imprimer" style="margin-right: 5px;">👁️</button>
                                <button class="btn-edit" onclick="event.stopPropagation(); editFacture(${
                                  facture.id
                                }); document.querySelector('[style*=fixed]').remove(); switchTab('factures');" title="Modifier">✏️</button>
                            </td>
                        </tr>
                    `;
                  })
                  .join("")}
            </tbody>
        </table>
    `;

  modal.appendChild(modalContent);
  document.body.appendChild(modal);

  // Fermer la modale en cliquant à l'extérieur
  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

// STRUCTURES
function showStructureForm() {
  currentEditStructure = null;
  document.getElementById("structureForm").classList.add("active");
  document.getElementById("structureNom").value = "";
  document.getElementById("structureQuartier").value = "";
  document.getElementById("structureAdresse").value = "";
  document.getElementById("structureTelephone").value = "";
  document.getElementById("structureEmail").value = "";
}

function cancelStructureForm() {
  document.getElementById("structureForm").classList.remove("active");
  currentEditStructure = null;
}

function saveStructure() {
  const nom = document.getElementById("structureNom").value.trim();
  const quartier = document.getElementById("structureQuartier").value;
  const adresse = document.getElementById("structureAdresse").value.trim();
  const telephone = document.getElementById("structureTelephone").value.trim();
  const email = document.getElementById("structureEmail").value.trim();

  if (!nom || !quartier) {
    alert("Veuillez remplir tous les champs obligatoires (*)");
    return;
  }

  if (currentEditStructure) {
    const index = structures.findIndex((s) => s.id === currentEditStructure);
    structures[index] = {
      ...structures[index],
      nom,
      quartier,
      adresse,
      telephone,
      email,
    };
  } else {
    const newStructure = {
      id:
        structures.length > 0
          ? Math.max(...structures.map((s) => s.id)) + 1
          : 1,
      nom,
      quartier,
      adresse,
      telephone,
      email,
    };
    structures.push(newStructure);
  }

  saveData();
  cancelStructureForm();
  renderStructures();
  updateStructureSelect();
  updateDashboard();
}

function editStructure(id) {
  const structure = structures.find((s) => s.id === id);
  if (!structure) return;

  currentEditStructure = id;
  document.getElementById("structureForm").classList.add("active");
  document.getElementById("structureNom").value = structure.nom;
  document.getElementById("structureQuartier").value = structure.quartier;
  document.getElementById("structureAdresse").value = structure.adresse || "";
  document.getElementById("structureTelephone").value =
    structure.telephone || "";
  document.getElementById("structureEmail").value = structure.email || "";

  document
    .getElementById("structureForm")
    .scrollIntoView({ behavior: "smooth" });
}

function deleteStructure(id) {
  if (
    !confirm(
      "Êtes-vous sûr de vouloir supprimer cette structure ? Toutes ses factures seront également supprimées."
    )
  ) {
    return;
  }

  structures = structures.filter((s) => s.id !== id);
  factures = factures.filter((f) => f.structureId !== id);

  saveData();
  renderStructures();
  updateStructureSelect();
  updateDashboard();
}

function filterStructures() {
  const searchTerm = document
    .getElementById("searchStructure")
    .value.toLowerCase();
  const quartierFilter = document.getElementById("filterQuartier").value;

  const filtered = structures.filter((s) => {
    const matchSearch =
      s.nom.toLowerCase().includes(searchTerm) ||
      (s.adresse && s.adresse.toLowerCase().includes(searchTerm));
    const matchQuartier = !quartierFilter || s.quartier === quartierFilter;
    return matchSearch && matchQuartier;
  });

  renderStructures(filtered);
}

function renderStructures(structuresToRender = structures) {
  const structuresList = document.getElementById("structuresList");

  if (structuresToRender.length === 0) {
    structuresList.innerHTML =
      '<p style="text-align: center; color: #718096; padding: 40px;">Aucune structure trouvée.</p>';
    return;
  }

  structuresList.innerHTML = structuresToRender
    .map((structure) => {
      const structureFactures = factures.filter(
        (f) => f.structureId === structure.id
      );
      const totalFactures = structureFactures.length;
      const montantTotal = structureFactures.reduce(
        (sum, f) => sum + f.montant,
        0
      );

      return `
            <div class="structure-card">
                <div class="structure-header">
                    <div>
                        <div class="structure-name">${structure.nom}</div>
                        <span class="quartier-badge">${
                          structure.quartier
                        }</span>
                        ${
                          structure.adresse
                            ? `<div class="structure-info">📍 ${structure.adresse}</div>`
                            : ""
                        }
                        ${
                          structure.telephone
                            ? `<div class="structure-info">📞 ${structure.telephone}</div>`
                            : ""
                        }
                        ${
                          structure.email
                            ? `<div class="structure-info">📧 ${structure.email}</div>`
                            : ""
                        }
                        <div class="structure-info" style="margin-top: 10px; font-weight: 600;">
                            ${totalFactures} facture(s) • ${formatMontant(
        montantTotal
      )} FCFA
                        </div>
                    </div>
                    <div>
                        <button class="btn-edit" onclick="editStructure(${
                          structure.id
                        })">✏️ Modifier</button>
                        <button class="btn-delete" onclick="deleteStructure(${
                          structure.id
                        })">🗑️ Supprimer</button>
                    </div>
                </div>
            </div>
        `;
    })
    .join("");
}

// FACTURES - GESTION DES ARTICLES
function addArticleLine() {
  const article = {
    designation: "",
    quantite: 1,
    prixUnitaire: 0,
    total: 0,
  };
  currentArticles.push(article);
  renderArticlesForm();
}

function removeArticleLine(index) {
  currentArticles.splice(index, 1);
  renderArticlesForm();
}

function updateArticleTotal(index) {
  const quantite =
    parseFloat(document.getElementById(`article_quantite_${index}`).value) || 0;
  const prixUnitaire =
    parseFloat(document.getElementById(`article_prix_${index}`).value) || 0;
  currentArticles[index].total = quantite * prixUnitaire;

  document.getElementById(`article_total_${index}`).textContent = formatMontant(
    currentArticles[index].total
  );
  calculateFactureTotal();
}

function calculateFactureTotal() {
  const sousTotal = currentArticles.reduce((sum, art) => sum + art.total, 0);
  const tva = parseFloat(document.getElementById("factureTVA").value) || 0;
  const remise =
    parseFloat(document.getElementById("factureRemise").value) || 0;

  const montantRemise = sousTotal * (remise / 100);
  const montantTVA = (sousTotal - montantRemise) * (tva / 100);
  const total = sousTotal - montantRemise + montantTVA;

  document.getElementById("factureSousTotal").textContent =
    formatMontant(sousTotal);
  document.getElementById("factureMontantRemise").textContent =
    formatMontant(montantRemise);
  document.getElementById("factureMontantTVA").textContent =
    formatMontant(montantTVA);
  document.getElementById("factureTotal").textContent = formatMontant(total);
}

function renderArticlesForm() {
  const articlesContainer = document.getElementById("articlesContainer");

  articlesContainer.innerHTML = `
        <div style="margin-bottom: 15px;">
            <button type="button" class="btn-primary" onclick="addArticleLine()">➕ Ajouter une ligne</button>
        </div>
        <table style="width: 100%; margin-bottom: 20px;">
            <thead>
                <tr>
                    <th style="text-align: left; width: 40%;">Désignation</th>
                    <th style="text-align: center; width: 15%;">Quantité</th>
                    <th style="text-align: right; width: 20%;">Prix unitaire</th>
                    <th style="text-align: right; width: 20%;">Total</th>
                    <th style="text-align: center; width: 5%;"></th>
                </tr>
            </thead>
            <tbody>
                ${currentArticles
                  .map(
                    (article, index) => `
                    <tr>
                        <td>
                            <input type="text" 
                                   id="article_designation_${index}" 
                                   value="${article.designation}"
                                   placeholder="Description de l'article"
                                   style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 5px;"
                                   onchange="currentArticles[${index}].designation = this.value">
                        </td>
                        <td>
                            <input type="number" 
                                   id="article_quantite_${index}" 
                                   value="${article.quantite}"
                                   min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 5px; text-align: center;"
                                   onchange="currentArticles[${index}].quantite = parseFloat(this.value); updateArticleTotal(${index})">
                        </td>
                        <td>
                            <input type="number" 
                                   id="article_prix_${index}" 
                                   value="${article.prixUnitaire}"
                                   min="0"
                                   style="width: 100%; padding: 8px; border: 1px solid #cbd5e0; border-radius: 5px; text-align: right;"
                                   onchange="currentArticles[${index}].prixUnitaire = parseFloat(this.value); updateArticleTotal(${index})">
                        </td>
                        <td style="text-align: right; font-weight: 600; padding: 8px;">
                            <span id="article_total_${index}">${formatMontant(
                      article.total
                    )}</span> FCFA
                        </td>
                        <td style="text-align: center;">
                            <button type="button" class="btn-delete" onclick="removeArticleLine(${index})" style="padding: 5px 10px;">🗑️</button>
                        </td>
                    </tr>
                `
                  )
                  .join("")}
            </tbody>
        </table>
        <div style="background: #f7fafc; padding: 15px; border-radius: 8px;">
            <div style="display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 10px;">
                <strong>Sous-total:</strong>
                <span id="factureSousTotal">0</span> FCFA
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 10px;">
                <strong>Remise:</strong>
                <span id="factureMontantRemise">0</span> FCFA
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 20px; margin-bottom: 10px;">
                <strong>TVA:</strong>
                <span id="factureMontantTVA">0</span> FCFA
            </div>
            <div style="display: flex; justify-content: flex-end; gap: 20px; font-size: 1.2em; color: #4c51bf;">
                <strong>TOTAL TTC:</strong>
                <strong id="factureTotal">0</strong> FCFA
            </div>
        </div>
    `;

  calculateFactureTotal();
}

// FACTURES
function showFactureForm() {
  currentEditFacture = null;
  currentArticles = [
    { designation: "", quantite: 1, prixUnitaire: 0, total: 0 },
  ];

  document.getElementById("factureForm").classList.add("active");
  document.getElementById("factureStructure").value = "";
  document.getElementById("factureNumero").value = generateFactureNumber();
  document.getElementById("factureDescription").value = "";
  document.getElementById("factureDateEmission").value = new Date()
    .toISOString()
    .split("T")[0];
  document.getElementById("factureDateEcheance").value = "";
  document.getElementById("factureStatut").value = "impayée";
  document.getElementById("factureTVA").value = "18";
  document.getElementById("factureRemise").value = "0";
  document.getElementById("factureNotes").value = "";

  renderArticlesForm();
}

function generateFactureNumber() {
  const year = new Date().getFullYear();
  const lastNumber =
    factures.length > 0
      ? Math.max(
          ...factures.map((f) => {
            const match = f.numero.match(/\d+$/);
            return match ? parseInt(match[0]) : 0;
          })
        )
      : 0;
  return `FACT-${year}-${String(lastNumber + 1).padStart(3, "0")}`;
}

function cancelFactureForm() {
  document.getElementById("factureForm").classList.remove("active");
  currentEditFacture = null;
  currentArticles = [];
}

function saveFacture() {
  const structureId = parseInt(
    document.getElementById("factureStructure").value
  );
  const numero = document.getElementById("factureNumero").value.trim();
  const description = document
    .getElementById("factureDescription")
    .value.trim();
  const dateEmission = document.getElementById("factureDateEmission").value;
  const dateEcheance = document.getElementById("factureDateEcheance").value;
  const statut = document.getElementById("factureStatut").value;
  const tva = parseFloat(document.getElementById("factureTVA").value) || 0;
  const remise =
    parseFloat(document.getElementById("factureRemise").value) || 0;
  const notes = document.getElementById("factureNotes").value.trim();

  if (!structureId || !numero || !dateEmission || !dateEcheance) {
    alert("Veuillez remplir tous les champs obligatoires (*)");
    return;
  }

  if (
    currentArticles.length === 0 ||
    !currentArticles.some((a) => a.designation)
  ) {
    alert("Veuillez ajouter au moins un article à la facture");
    return;
  }

  // Mettre à jour les articles avec les valeurs actuelles
  currentArticles.forEach((article, index) => {
    article.designation = document.getElementById(
      `article_designation_${index}`
    ).value;
    article.quantite =
      parseFloat(document.getElementById(`article_quantite_${index}`).value) ||
      0;
    article.prixUnitaire =
      parseFloat(document.getElementById(`article_prix_${index}`).value) || 0;
    article.total = article.quantite * article.prixUnitaire;
  });

  // Calculer le montant total
  const sousTotal = currentArticles.reduce((sum, art) => sum + art.total, 0);
  const montantRemise = sousTotal * (remise / 100);
  const montantTVA = (sousTotal - montantRemise) * (tva / 100);
  const montant = sousTotal - montantRemise + montantTVA;

  if (currentEditFacture) {
    const index = factures.findIndex((f) => f.id === currentEditFacture);
    factures[index] = {
      ...factures[index],
      structureId,
      numero,
      description,
      articles: [...currentArticles],
      montant,
      tva,
      remise,
      notes,
      dateEmission,
      dateEcheance,
      statut,
    };
  } else {
    const newFacture = {
      id: factures.length > 0 ? Math.max(...factures.map((f) => f.id)) + 1 : 1,
      structureId,
      numero,
      description,
      articles: [...currentArticles],
      montant,
      tva,
      remise,
      notes,
      dateEmission,
      dateEcheance,
      statut,
    };
    factures.push(newFacture);
  }

  saveData();
  cancelFactureForm();
  renderFactures();
  updateDashboard();
}

function editFacture(id) {
  const facture = factures.find((f) => f.id === id);
  if (!facture) return;

  currentEditFacture = id;
  currentArticles = facture.articles
    ? [...facture.articles]
    : [{ designation: "", quantite: 1, prixUnitaire: 0, total: 0 }];

  document.getElementById("factureForm").classList.add("active");
  document.getElementById("factureStructure").value = facture.structureId;
  document.getElementById("factureNumero").value = facture.numero;
  document.getElementById("factureDescription").value =
    facture.description || "";
  document.getElementById("factureDateEmission").value = facture.dateEmission;
  document.getElementById("factureDateEcheance").value = facture.dateEcheance;
  document.getElementById("factureStatut").value = facture.statut;
  document.getElementById("factureTVA").value = facture.tva || 18;
  document.getElementById("factureRemise").value = facture.remise || 0;
  document.getElementById("factureNotes").value = facture.notes || "";

  renderArticlesForm();
  document.getElementById("factureForm").scrollIntoView({ behavior: "smooth" });
}

function deleteFacture(id) {
  if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
    return;
  }

  factures = factures.filter((f) => f.id !== id);

  saveData();
  renderFactures();
  updateDashboard();
}

function viewFacture(id) {
  const facture = factures.find((f) => f.id === id);
  if (!facture) return;

  const structure = structures.find((s) => s.id === facture.structureId);
  if (!structure) {
    alert("Structure introuvable");
    return;
  }

  // Calculer les montants
  const sousTotal = facture.articles.reduce((sum, art) => sum + art.total, 0);
  const montantRemise = sousTotal * (facture.remise / 100);
  const montantTVA = (sousTotal - montantRemise) * (facture.tva / 100);

  const printWindow = window.open("", "", "width=800,height=600");
  printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Facture ${facture.numero}</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { 
                    font-family: Arial, sans-serif; 
                    padding: 40px; 
                    color: #333;
                    background: white;
                }
                .header { 
                    display: flex; 
                    justify-content: space-between; 
                    margin-bottom: 40px;
                    padding-bottom: 20px;
                    border-bottom: 3px solid #4c51bf;
                }
                .company-info h1 { 
                    color: #4c51bf; 
                    font-size: 28px;
                    margin-bottom: 10px;
                }
                .facture-info { text-align: right; }
                .facture-info h2 { 
                    color: #4c51bf; 
                    font-size: 24px;
                    margin-bottom: 10px;
                }
                .client-info { 
                    background: #f7fafc; 
                    padding: 20px; 
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                .client-info h3 { 
                    color: #2d3748; 
                    margin-bottom: 10px;
                }
                .info-line { 
                    margin: 5px 0; 
                    color: #4a5568;
                }
                .description {
                    background: #edf2f7;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    font-style: italic;
                }
                table { 
                    width: 100%; 
                    border-collapse: collapse; 
                    margin-bottom: 30px;
                }
                thead { background: #4c51bf; color: white; }
                th, td { 
                    padding: 12px; 
                    text-align: left; 
                    border-bottom: 1px solid #e2e8f0;
                }
                th { font-weight: 600; }
                tbody tr:hover { background: #f7fafc; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                .totals { 
                    margin-left: auto; 
                    width: 400px;
                    background: #f7fafc;
                    padding: 20px;
                    border-radius: 8px;
                }
                .total-line { 
                    display: flex; 
                    justify-content: space-between; 
                    margin: 10px 0;
                    padding: 5px 0;
                }
                .total-final { 
                    font-size: 20px; 
                    font-weight: bold; 
                    color: #4c51bf;
                    border-top: 2px solid #4c51bf;
                    padding-top: 10px;
                    margin-top: 10px;
                }
                .notes { 
                    margin-top: 30px; 
                    padding: 20px;
                    background: #fffaf0;
                    border-left: 4px solid #f59e0b;
                    border-radius: 4px;
                }
                .notes h4 { 
                    color: #92400e;
                    margin-bottom: 10px;
                }
                .footer { 
                    margin-top: 50px; 
                    text-align: center; 
                    color: #718096;
                    padding-top: 20px;
                    border-top: 1px solid #e2e8f0;
                    font-size: 12px;
                }
                @media print {
                    body { padding: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <div class="company-info">
                    <h1>🏢 Votre Entreprise</h1>
                    <div class="info-line">Adresse de votre entreprise</div>
                    <div class="info-line">Téléphone: +225 XX XX XX XX XX</div>
                    <div class="info-line">Email: contact@entreprise.com</div>
                </div>
                <div class="facture-info">
                    <h2>FACTURE</h2>
                    <div class="info-line"><strong>${
                      facture.numero
                    }</strong></div>
                    <div class="info-line">Date: ${formatDate(
                      facture.dateEmission
                    )}</div>
                    <div class="info-line">Échéance: ${formatDate(
                      facture.dateEcheance
                    )}</div>
                </div>
            </div>

            <div class="client-info">
                <h3>Facturé à:</h3>
                <div class="info-line"><strong>${structure.nom}</strong></div>
                <div class="info-line">📍 ${structure.quartier}${
    structure.adresse ? ", " + structure.adresse : ""
  }</div>
                ${
                  structure.telephone
                    ? `<div class="info-line">📞 ${structure.telephone}</div>`
                    : ""
                }
                ${
                  structure.email
                    ? `<div class="info-line">📧 ${structure.email}</div>`
                    : ""
                }
            </div>

            ${
              facture.description
                ? `
                <div class="description">
                    <strong>Description:</strong> ${facture.description}
                </div>
            `
                : ""
            }

            <table>
                <thead>
                    <tr>
                        <th>Désignation</th>
                        <th class="text-center">Quantité</th>
                        <th class="text-right">Prix unitaire</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${facture.articles
                      .map(
                        (article) => `
                        <tr>
                            <td>${article.designation}</td>
                            <td class="text-center">${article.quantite}</td>
                            <td class="text-right">${formatMontant(
                              article.prixUnitaire
                            )} FCFA</td>
                            <td class="text-right"><strong>${formatMontant(
                              article.total
                            )} FCFA</strong></td>
                        </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>

            <div class="totals">
                <div class="total-line">
                    <span>Sous-total:</span>
                    <strong>${formatMontant(sousTotal)} FCFA</strong>
                </div>
                ${
                  facture.remise > 0
                    ? `
                    <div class="total-line" style="color: #10b981;">
                        <span>Remise (${facture.remise}%):</span>
                        <strong>- ${formatMontant(montantRemise)} FCFA</strong>
                    </div>
                `
                    : ""
                }
                <div class="total-line">
                    <span>TVA (${facture.tva}%):</span>
                    <strong>${formatMontant(montantTVA)} FCFA</strong>
                </div>
                <div class="total-line total-final">
                    <span>TOTAL TTC:</span>
                    <strong>${formatMontant(facture.montant)} FCFA</strong>
                </div>
            </div>

            ${
              facture.notes
                ? `
                <div class="notes">
                    <h4>📝 Notes:</h4>
                    <p>${facture.notes}</p>
                </div>
            `
                : ""
            }

            <div class="footer">
                <p>Merci pour votre confiance</p>
                <p>En cas de question concernant cette facture, veuillez nous contacter</p>
            </div>

            <div class="no-print" style="text-align: center; margin-top: 30px;">
                <button onclick="window.print()" style="background: #4c51bf; color: white; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 16px; margin-right: 10px;">
                    🖨️ Imprimer
                </button>
                <button onclick="window.close()" style="background: #cbd5e0; color: #2d3748; border: none; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    ✖️ Fermer
                </button>
            </div>

            <script>
                // Auto-print après chargement (optionnel)
                // window.onload = () => window.print();
            </script>
        </body>
        </html>
    `);
  printWindow.document.close();
}

function updateStructureSelect() {
  const select = document.getElementById("factureStructure");
  select.innerHTML =
    '<option value="">Sélectionner une structure</option>' +
    structures
      .map((s) => `<option value="${s.id}">${s.nom} (${s.quartier})</option>`)
      .join("");
}

function renderFactures() {
  const facturesTable = document.getElementById("facturesTable");

  if (factures.length === 0) {
    facturesTable.innerHTML =
      '<p style="text-align: center; color: #718096; padding: 40px;">Aucune facture enregistrée.</p>';
    return;
  }

  const sortedFactures = [...factures].sort(
    (a, b) => new Date(b.dateEmission) - new Date(a.dateEmission)
  );

  facturesTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Numéro</th>
                    <th>Structure</th>
                    <th>Quartier</th>
                    <th>Description</th>
                    <th>Montant</th>
                    <th>Date émission</th>
                    <th>Date échéance</th>
                    <th>Statut</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${sortedFactures
                  .map((facture) => {
                    const structure = structures.find(
                      (s) => s.id === facture.structureId
                    );
                    const structureNom = structure
                      ? structure.nom
                      : "Structure supprimée";
                    const quartier = structure ? structure.quartier : "-";
                    const statusClass =
                      facture.statut === "payée"
                        ? "status-payee"
                        : facture.statut === "en retard"
                        ? "status-retard"
                        : "status-impayee";

                    return `
                        <tr>
                            <td><strong>${facture.numero}</strong></td>
                            <td>${structureNom}</td>
                            <td><span class="quartier-badge">${quartier}</span></td>
                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${facture.description || "-"}
                            </td>
                            <td><strong>${formatMontant(
                              facture.montant
                            )} FCFA</strong></td>
                            <td>${formatDate(facture.dateEmission)}</td>
                            <td>${formatDate(facture.dateEcheance)}</td>
                            <td><span class="status-badge ${statusClass}">${capitalizeFirst(
                      facture.statut
                    )}</span></td>
                            <td>
                                <button class="btn-edit" onclick="viewFacture(${
                                  facture.id
                                })" title="Voir/Imprimer">👁️</button>
                                <button class="btn-edit" onclick="editFacture(${
                                  facture.id
                                })" title="Modifier">✏️</button>
                                <button class="btn-delete" onclick="deleteFacture(${
                                  facture.id
                                })" title="Supprimer">🗑️</button>
                            </td>
                        </tr>
                    `;
                  })
                  .join("")}
            </tbody>
        </table>
    `;
}

// UTILITAIRES
function formatMontant(montant) {
  return new Intl.NumberFormat("fr-FR").format(montant);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function capitalizeFirst(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
