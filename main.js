// ===============================================
// CONFIGURATION GLOBALE ET DONNÉES EN MÉMOIRE
// ===============================================

const DB_NAME = 'FacturesDB';
const DB_VERSION = 1;
let db;

// Données en mémoire
let structures = [];
let factures = [];
let quartiers = [];
let currentEditStructure = null;
let currentEditFacture = null;
let currentEditQuartier = null;
let currentArticles = [];

// ===============================================
// INITIALISATION DE LA BASE DE DONNÉES (IndexedDB)
// ===============================================

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = (event) => {
            console.error("Erreur IndexedDB:", event.target.errorCode);
            reject(new Error("Erreur IndexedDB"));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('structures')) {
                db.createObjectStore('structures', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('factures')) {
                db.createObjectStore('factures', { keyPath: 'id', autoIncrement: true });
            }
            if (!db.objectStoreNames.contains('quartiers')) {
                db.createObjectStore('quartiers', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

function getData(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

function putData(storeName, data) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(data);

        request.onsuccess = (event) => {
            resolve(event.target.result);
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

function deleteData(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = (event) => {
            reject(event.target.error);
        };
    });
}

// Fonction pour sauvegarder toutes les données et rafraîchir la liste en mémoire
async function saveData() {
    try {
        // Sauvegarde de toutes les factures modifiées
        for(const f of factures) {
            // Mettre à jour la DB pour toutes les factures (y compris celles dont on a changé le statut)
            await putData('factures', f);
        }
        await loadData(); // Recharger toutes les données pour synchronisation
        return true;
    } catch (e) {
        console.error("Erreur de sauvegarde des données IndexedDB:", e);
        alert("Erreur critique lors de la sauvegarde des données.");
        return false;
    }
}


// ===============================================
// LOGIQUE DE CHARGEMENT / SAUVEGARDE DES DONNÉES
// ===============================================

async function loadData() {
    try {
        structures = await getData('structures');
        factures = await getData('factures');
        
        let loadedQuartiers = await getData('quartiers');
        if (loadedQuartiers.length === 0) {
            quartiers = getDefaultQuartiers();
            for (const q of quartiers) {
                await putData('quartiers', q);
            }
        } else {
            quartiers = loadedQuartiers;
        }

    } catch (e) {
        console.error("Erreur de chargement des données IndexedDB:", e);
        // Fallback ou message d'erreur supplémentaire si nécessaire
    }
}

// ===============================================
// GESTION DES QUARTIERS
// ===============================================

function getDefaultQuartiers() {
    // Les ID seront attribués par IndexedDB lors de la sauvegarde
    return [
        { nom: "Cocody" },
        { nom: "Plateau" },
        { nom: "Adjamé" },
        { nom: "Yopougon" },
        { nom: "Marcory" },
        { nom: "Abobo" },
        { nom: "Koumassi" },
        { nom: "Treichville" }
    ];
}

async function resetToDefaultQuartiers() {
    if (!confirm("Êtes-vous sûr de vouloir réinitialiser la liste des quartiers ? Toutes les données de quartiers actuelles seront effacées.")) {
        return;
    }
    try {
        const quartierStore = db.transaction(['quartiers'], 'readwrite').objectStore('quartiers');
        await new Promise((resolve, reject) => {
            const clearRequest = quartierStore.clear();
            clearRequest.onsuccess = resolve;
            clearRequest.onerror = reject;
        });

        // Les ID seront générés automatiquement par putData
        const defaultQuartiers = getDefaultQuartiers();

        for (const q of defaultQuartiers) {
            await putData('quartiers', q);
        }

        await loadData(); // Recharger les quartiers avec les nouveaux ID
        renderQuartiers();
        updateAllQuartiersSelects();
        updateDashboard();
        alert("Les quartiers ont été réinitialisés aux valeurs par défaut d'Abidjan.");
    } catch (e) {
        console.error("Erreur lors de la réinitialisation des quartiers:", e);
        alert("Erreur lors de la réinitialisation.");
    }
}

async function saveQuartier() {
    const nom = document.getElementById('quartierNom').value.trim();

    if (!nom) {
        alert("Veuillez entrer un nom de quartier.");
        return;
    }

    try {
        const quartierData = currentEditQuartier ? { ...currentEditQuartier, nom } : { nom };
        await putData('quartiers', quartierData);
        
        // Mettre à jour la liste en mémoire
        await loadData();

        document.getElementById('quartierNom').value = '';
        currentEditQuartier = null;
        document.getElementById('quartierForm').classList.remove('active');
        
        renderQuartiers();
        updateAllQuartiersSelects();
        updateDashboard();
        alert(`Quartier "${nom}" enregistré.`);
    } catch (e) {
        console.error("Erreur d'enregistrement du quartier:", e);
        alert("Erreur lors de l'enregistrement du quartier.");
    }
}

function showQuartierForm(quartier = null) {
    const form = document.getElementById('quartierForm');
    const input = document.getElementById('quartierNom');
    
    currentEditQuartier = quartier;
    
    if (quartier) {
        input.value = quartier.nom;
        form.querySelector('h3').textContent = 'Modifier un Quartier/Zone';
    } else {
        input.value = '';
        form.querySelector('h3').textContent = 'Ajouter un Quartier/Zone';
    }

    form.classList.add('active');
    input.focus();
}

function cancelQuartierForm() {
    document.getElementById('quartierForm').classList.remove('active');
    document.getElementById('quartierNom').value = '';
    currentEditQuartier = null;
}

async function deleteQuartier(id) {
    const quartierNom = quartiers.find(q => q.id === id)?.nom;
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le quartier "${quartierNom}" ?`)) {
        return;
    }
    try {
        // Vérification de dépendance (Simplifiée: en prod, on devrait gérer les structures associées)
        const linkedStructures = structures.filter(s => s.quartier === quartierNom);
        if (linkedStructures.length > 0) {
            alert(`Impossible de supprimer. ${linkedStructures.length} structure(s) utilise(nt) ce quartier. Veuillez les modifier ou les supprimer d'abord.`);
            return;
        }

        await deleteData('quartiers', id);
        await loadData();
        renderQuartiers();
        updateAllQuartiersSelects();
        updateDashboard();
        alert("Quartier supprimé.");
    } catch (e) {
        console.error("Erreur de suppression du quartier:", e);
        alert("Erreur lors de la suppression du quartier.");
    }
}

function renderQuartiers() {
    const list = document.getElementById('quartiersList');
    if (!list) return;

    if (quartiers.length === 0) {
        list.innerHTML = '<p style="color: #718096; text-align: center; padding: 20px;">Aucun quartier configuré. Ajoutez-en un ou réinitialisez la liste.</p>';
        return;
    }

    list.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Nom du Quartier</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${quartiers.map(q => `
                    <tr>
                        <td data-label="Quartier">${q.nom}</td>
                        <td data-label="Actions">
                            <button class="btn-edit" onclick="showQuartierForm(${JSON.stringify(q).replace(/"/g, '&quot;')})">✏️ Modifier</button>
                            <button class="btn-delete" onclick="deleteQuartier(${q.id})">🗑️ Supprimer</button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function updateAllQuartiersSelects() {
    const selectIds = ['structureQuartier', 'filterQuartier'];
    
    selectIds.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            const currentValue = select.value;
            select.innerHTML = '';
            
            // Option par défaut (varie selon le select)
            let defaultOption = '';
            if (id === 'structureQuartier') {
                defaultOption = '<option value="">Sélectionner un quartier</option>';
            } else if (id === 'filterQuartier') {
                defaultOption = '<option value="">Tous les quartiers</option>';
            }
            select.insertAdjacentHTML('beforeend', defaultOption);

            quartiers.forEach(q => {
                const option = document.createElement('option');
                option.value = q.nom;
                option.textContent = q.nom;
                select.appendChild(option);
            });

            // Retablir la valeur selectionnée si elle existe
            if (currentValue) {
                select.value = currentValue;
            }
        }
    });
}


// ===============================================
// GESTION DES STRUCTURES
// ===============================================

async function saveStructure() {
    const nom = document.getElementById('structureNom').value.trim();
    const quartier = document.getElementById('structureQuartier').value;
    const adresse = document.getElementById('structureAdresse').value.trim();
    const telephone = document.getElementById('structureTelephone').value.trim();
    const email = document.getElementById('structureEmail').value.trim();

    if (!nom || !quartier) {
        alert("Veuillez remplir le nom et le quartier de la structure.");
        return;
    }

    try {
        const structureData = { 
            nom, 
            quartier, 
            adresse, 
            telephone, 
            email 
        };

        if (currentEditStructure) {
            structureData.id = currentEditStructure.id;
        }

        await putData('structures', structureData);
        await loadData();
        
        cancelStructureForm(); // Réinitialise le formulaire et le cache
        renderStructures();
        updateStructureSelect();
        updateDashboard();
        alert(`Structure "${nom}" enregistrée.`);

    } catch (e) {
        console.error("Erreur d'enregistrement de la structure:", e);
        alert("Erreur lors de l'enregistrement de la structure.");
    }
}

function showStructureForm(structure = null) {
    const form = document.getElementById('structureForm');
    currentEditStructure = structure;

    if (structure) {
        form.querySelector('h3').textContent = 'Modifier la Structure';
        document.getElementById('structureNom').value = structure.nom;
        document.getElementById('structureQuartier').value = structure.quartier;
        document.getElementById('structureAdresse').value = structure.adresse;
        document.getElementById('structureTelephone').value = structure.telephone;
        document.getElementById('structureEmail').value = structure.email;
    } else {
        form.querySelector('h3').textContent = 'Nouvelle Structure';
        document.getElementById('structureNom').value = '';
        document.getElementById('structureQuartier').value = '';
        document.getElementById('structureAdresse').value = '';
        document.getElementById('structureTelephone').value = '';
        document.getElementById('structureEmail').value = '';
    }

    form.classList.add('active');
    document.getElementById('structureNom').focus();
}

function cancelStructureForm() {
    document.getElementById('structureForm').classList.remove('active');
    currentEditStructure = null;
}

async function deleteStructure(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette structure ? Toutes les factures liées resteront, mais la référence sera perdue.")) {
        return;
    }
    try {
        await deleteData('structures', id);
        await loadData();
        renderStructures();
        updateStructureSelect();
        updateDashboard();
        alert("Structure supprimée.");
    } catch (e) {
        console.error("Erreur de suppression de la structure:", e);
        alert("Erreur lors de la suppression de la structure.");
    }
}

function filterStructures() {
    const search = document.getElementById('searchStructure').value.toLowerCase();
    const filterQuartier = document.getElementById('filterQuartier').value;
    
    const filtered = structures.filter(s => {
        const matchesSearch = s.nom.toLowerCase().includes(search) || 
                              s.adresse.toLowerCase().includes(search) || 
                              s.telephone.includes(search);
        
        const matchesQuartier = !filterQuartier || s.quartier === filterQuartier;
        
        return matchesSearch && matchesQuartier;
    });

    renderStructures(filtered);
}

function renderStructures(list = structures) {
    const structuresList = document.getElementById('structuresList');
    if (!structuresList) return;
    
    if (list.length === 0) {
        structuresList.innerHTML = '<p style="color: #718096; text-align: center; padding: 20px;">Aucune structure trouvée.</p>';
        return;
    }

    structuresList.innerHTML = list.map(s => `
        <div class="structure-card">
            <div class="structure-header">
                <div>
                    <div class="structure-name">${s.nom}</div>
                    <span class="quartier-badge">${s.quartier}</span>
                </div>
                <div class="structure-actions">
                    <button class="btn-edit" onclick="showStructureForm(${JSON.stringify(s).replace(/"/g, '&quot;')})">✏️</button>
                    <button class="btn-delete" onclick="deleteStructure(${s.id})">🗑️</button>
                </div>
            </div>
            <div class="structure-info">Adresse: ${s.adresse || 'N/A'}</div>
            <div class="structure-info">Téléphone: ${s.telephone || 'N/A'}</div>
            <div class="structure-info">Email: ${s.email || 'N/A'}</div>
        </div>
    `).join('');
}

function updateStructureSelect() {
    const select = document.getElementById('factureStructure');
    if (!select) return;
    
    const currentValue = select.value;
    select.innerHTML = '<option value="">Sélectionner une structure</option>';

    structures.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = `${s.nom} (${s.quartier})`;
        select.appendChild(option);
    });

    if (currentValue) {
        select.value = currentValue;
    }
}


// ===============================================
// GESTION DES FACTURES (y compris articles)
// ===============================================

function addArticle(article = null) {
    const articlesContainer = document.getElementById('articlesContainer');
    const newIndex = currentArticles.length;
    
    const designation = article ? article.designation : '';
    const quantite = article ? article.quantite : 1;
    const prix = article ? article.prix : 0;
    
    const articleHTML = `
        <div class="article-row" id="articleRow-${newIndex}" style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 40px; gap: 10px; margin-bottom: 10px; align-items: center;">
            <input type="text" id="article_designation_${newIndex}" value="${designation}" placeholder="Désignation de l'article" oninput="calculateFactureTotal()" required>
            <input type="number" id="article_quantite_${newIndex}" value="${quantite}" min="1" step="1" oninput="calculateFactureTotal()" placeholder="Qté" required>
            <input type="number" id="article_prix_${newIndex}" value="${prix}" min="0" step="0.01" oninput="calculateFactureTotal()" placeholder="Prix Unitaire" required>
            <div id="article_total_${newIndex}" style="text-align: right; font-weight: 600;">${formatMontant(quantite * prix)} FCFA</div>
            <button type="button" class="btn-delete" onclick="removeArticle(${newIndex})" style="padding: 8px;">✖</button>
        </div>
    `;

    articlesContainer.insertAdjacentHTML('beforeend', articleHTML);
    
    if (!article) {
        currentArticles.push({ designation: '', quantite: 1, prix: 0 });
    }
}

function removeArticle(index) {
    // Retirer du DOM
    const row = document.getElementById(`articleRow-${index}`);
    if (row) {
        row.remove();
    }
    
    // Retirer des données en mémoire et re-indexer
    currentArticles.splice(index, 1);
    
    // Pour une gestion plus simple des IDs des inputs, on recharge le conteneur
    const articlesContainer = document.getElementById('articlesContainer');
    articlesContainer.innerHTML = '';
    const articlesToReadd = [...currentArticles];
    currentArticles = []; // Vider pour le remplissage
    
    articlesToReadd.forEach(a => addArticle(a));
    
    // Ajouter un bouton "Ajouter un article"
    if (articlesContainer.children.length === 0 || articlesContainer.lastChild.id !== 'addArticleBtnContainer') {
        articlesContainer.insertAdjacentHTML('beforeend', `
            <div id="addArticleBtnContainer" style="margin-top: 15px;">
                <button type="button" class="btn-secondary" onclick="addArticle()">+ Ajouter un article</button>
            </div>
        `);
    }

    calculateFactureTotal();
}


function readArticlesFromForm() {
    const newArticles = [];
    const container = document.getElementById('articlesContainer');
    const articleRows = container.querySelectorAll('.article-row');
    
    let isValid = true;

    articleRows.forEach((row, index) => {
        const designationInput = document.getElementById(`article_designation_${index}`);
        const quantiteInput = document.getElementById(`article_quantite_${index}`);
        const prixInput = document.getElementById(`article_prix_${index}`);
        
        const designation = designationInput ? designationInput.value.trim() : '';
        const quantite = parseFloat(quantiteInput ? quantiteInput.value : 0);
        const prix = parseFloat(prixInput ? prixInput.value : 0);

        if (!designation || quantite <= 0 || prix < 0) {
            // Pas d'alerte ici, la validation sera faite dans saveFacture
            isValid = false;
        } else {
            newArticles.push({ designation, quantite, prix });
        }
    });

    currentArticles = newArticles;
    return isValid;
}

function calculateFactureTotal() {
    // S'assurer que les articles sont à jour
    readArticlesFromForm();

    let subTotal = currentArticles.reduce((sum, item) => sum + (item.quantite * item.prix), 0);
    
    const tvaRate = parseFloat(document.getElementById('factureTVA').value) || 0;
    const remiseRate = parseFloat(document.getElementById('factureRemise').value) || 0;

    const tvaAmount = subTotal * (tvaRate / 100);
    const remiseAmount = subTotal * (remiseRate / 100);

    const total = subTotal + tvaAmount - remiseAmount;
    
    // Mise à jour des totaux individuels dans le formulaire (facultatif mais utile)
    currentArticles.forEach((a, index) => {
        const totalDiv = document.getElementById(`article_total_${index}`);
        if (totalDiv) {
            totalDiv.textContent = `${formatMontant(a.quantite * a.prix)} FCFA`;
        }
    });
    
    return { subTotal, tvaAmount, remiseAmount, total };
}

// Fonction utilitaire pour recalculer les totaux de la facture existante (pour la modale)
function calculateFactureTotalFromData(facture) {
    let subTotal = facture.articles.reduce((sum, item) => sum + (item.quantite * item.prix), 0);
    
    const tvaRate = facture.tva || 0;
    const remiseRate = facture.remise || 0;

    const tvaAmount = subTotal * (tvaRate / 100);
    const remiseAmount = subTotal * (remiseRate / 100);

    const total = subTotal + tvaAmount - remiseAmount;
    
    return { subTotal, tvaAmount, remiseAmount, total };
}

async function saveFacture() {
    const structureId = parseInt(document.getElementById('factureStructure').value);
    const numero = document.getElementById('factureNumero').value.trim();
    const dateEmission = document.getElementById('factureDateEmission').value;
    const dateEcheance = document.getElementById('factureDateEcheance').value;
    const statut = document.getElementById('factureStatut').value;
    const description = document.getElementById('factureDescription').value.trim();
    const notes = document.getElementById('factureNotes').value.trim();
    const tva = parseFloat(document.getElementById('factureTVA').value) || 0;
    const remise = parseFloat(document.getElementById('factureRemise').value) || 0;

    if (!structureId || !numero || !dateEmission || !dateEcheance) {
        alert("Veuillez remplir la structure, le numéro de facture, et les dates.");
        return;
    }
    
    // Lire et valider les articles
    if (!readArticlesFromForm() || currentArticles.length === 0) {
        alert("Veuillez ajouter au moins un article avec une désignation, quantité et prix valides.");
        return;
    }
    
    const totals = calculateFactureTotal();
    
    try {
        const factureData = {
            structureId,
            numero,
            dateEmission,
            dateEcheance,
            statut,
            description,
            notes,
            tva,
            remise,
            articles: currentArticles,
            montant: totals.total, // Montant TTC final
        };

        if (currentEditFacture) {
            factureData.id = currentEditFacture.id;
        }

        await putData('factures', factureData);
        await loadData();
        
        cancelFactureForm();
        renderFactures();
        updateDashboard();
        alert(`Facture N° ${numero} enregistrée.`);

    } catch (e) {
        console.error("Erreur d'enregistrement de la facture:", e);
        alert("Erreur lors de l'enregistrement de la facture.");
    }
}

function editFacture(id) {
    const facture = factures.find(f => f.id === id);
    if (facture) {
        showFactureForm(facture);
    } else {
        alert("Facture non trouvée.");
    }
}


function showFactureForm(facture = null) {
    const form = document.getElementById('factureForm');
    currentEditFacture = facture;

    const articlesContainer = document.getElementById('articlesContainer');
    articlesContainer.innerHTML = '';
    currentArticles = [];

    if (facture) {
        form.querySelector('h3').textContent = 'Modifier la Facture';
        document.getElementById('factureStructure').value = facture.structureId;
        document.getElementById('factureNumero').value = facture.numero;
        document.getElementById('factureDateEmission').value = facture.dateEmission;
        document.getElementById('factureDateEcheance').value = facture.dateEcheance;
        document.getElementById('factureStatut').value = facture.statut;
        document.getElementById('factureDescription').value = facture.description || '';
        document.getElementById('factureNotes').value = facture.notes || '';
        document.getElementById('factureTVA').value = facture.tva;
        document.getElementById('factureRemise').value = facture.remise;
        
        // Charger les articles
        if (facture.articles && facture.articles.length > 0) {
            facture.articles.forEach(a => addArticle(a));
        }
    } else {
        form.querySelector('h3').textContent = 'Nouvelle Facture';
        document.getElementById('factureStructure').value = '';
        document.getElementById('factureNumero').value = '';
        document.getElementById('factureDateEmission').value = '';
        document.getElementById('factureDateEcheance').value = '';
        document.getElementById('factureStatut').value = 'impayée';
        document.getElementById('factureDescription').value = '';
        document.getElementById('factureNotes').value = '';
        document.getElementById('factureTVA').value = '18';
        document.getElementById('factureRemise').value = '0';
        
        // Article par défaut
        addArticle();
    }
    
    articlesContainer.insertAdjacentHTML('beforeend', `
        <div id="addArticleBtnContainer" style="margin-top: 15px;">
            <button type="button" class="btn-secondary" onclick="addArticle()">+ Ajouter un article</button>
        </div>
    `);
    
    calculateFactureTotal(); // Recalculer les totaux initiaux
    form.classList.add('active');
    document.getElementById('factureNumero').focus();
}

function cancelFactureForm() {
    document.getElementById('factureForm').classList.remove('active');
    currentEditFacture = null;
    currentArticles = [];
}

async function deleteFacture(id) {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) {
        return;
    }
    try {
        await deleteData('factures', id);
        await loadData();
        renderFactures();
        updateDashboard();
        alert("Facture supprimée.");
    } catch (e) {
        console.error("Erreur de suppression de la facture:", e);
        alert("Erreur lors de la suppression de la facture.");
    }
}

/**
 * Met à jour le statut d'une facture à "payée" et sauvegarde en base.
 * @param {number} id - L'ID de la facture à mettre à jour.
 */
function markFactureAsPaid(id) {
    const facture = factures.find((f) => f.id === id);
    if (!facture) return;

    if (facture.statut === "payée") {
        alert(`La facture N° ${facture.numero} est déjà marquée comme payée.`);
        return;
    }

    if (
        !confirm(
            `Êtes-vous sûr de vouloir marquer la facture N° ${facture.numero} comme PAYÉE ?`
        )
    ) {
        return;
    }

    // Mettre à jour le statut
    facture.statut = "payée";

    // Sauvegarder les données et rafraîchir l'affichage
    // Note: On utilise putData sur la facture spécifique pour une mise à jour rapide.
    putData('factures', facture)
        .then(() => loadData()) // Recharger les données après la sauvegarde
        .then(() => {
            renderFactures();
            updateDashboard();
            alert(`La facture N° ${facture.numero} a été marquée comme payée avec succès.`);
        })
        .catch(e => {
            console.error("Erreur lors du marquage comme payé:", e);
            alert("Erreur lors de la mise à jour du statut de la facture.");
        });
}


// Mise à jour : Ajout des data-label pour la responsivité et du bouton "Payer"
function renderFactures(list = factures) {
    const facturesList = document.getElementById('facturesList');
    if (!facturesList) return;
    
    if (list.length === 0) {
        facturesList.innerHTML = '<p style="color: #718096; text-align: center; padding: 20px;">Aucune facture trouvée.</p>';
        return;
    }

    facturesList.innerHTML = `
        <table class="data-table">
            <thead>
                <tr>
                    <th>N° Facture</th>
                    <th>Structure</th>
                    <th>Quartier</th>
                    <th style="text-align: right;">Montant TTC</th>
                    <th>Statut</th>
                    <th>Échéance</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                ${list
                  .map((facture) => {
                    const structure = structures.find(
                      (s) => s.id === facture.structureId
                    );
                    let statusClass = 'status-impayee';
                    if (facture.statut === 'payée') {
                        statusClass = 'status-payee';
                    } else if (facture.statut === 'en retard') {
                        statusClass = 'status-retard';
                    }

                    return `
                        <tr>
                            <td data-label="N° Facture"><strong>${facture.numero}</strong></td>
                            <td data-label="Structure">${structure ? structure.nom : "N/A"}</td>
                            <td data-label="Quartier">${structure ? structure.quartier : "N/A"}</td>
                            <td data-label="Montant TTC" style="text-align: right;">${formatMontant(
                                facture.montant
                            )} FCFA</td>
                            <td data-label="Statut"><span class="status-badge ${statusClass}">${capitalizeFirst(
                                facture.statut
                            )}</span></td>
                            <td data-label="Échéance">${formatDate(facture.dateEcheance)}</td>
                            <td data-label="Actions">
                                ${
                                  facture.statut !== "payée"
                                    ? `<button class="btn-edit" 
                                              onclick="markFactureAsPaid(${facture.id})" 
                                              title="Marquer comme Payée" 
                                              style="background: #38A169; color: white; margin-right: 5px;">✅</button>`
                                    : ""
                                }
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

// ===============================================
// TABLEAU DE BORD (DASHBOARD)
// ===============================================

function updateDashboard() {
    const dashboardGrid = document.getElementById('dashboardGrid');
    if (!dashboardGrid) return;
    
    // Calcul des totaux par quartier (se basant uniquement sur les structures ENREGISTRÉES dans les quartiers configurés)
    const stats = {};
    
    quartiers.forEach(q => {
        stats[q.nom] = {
            totalStructures: 0,
            totalFactures: 0,
            montantTotal: 0,
            montantPaye: 0,
            montantImpaye: 0,
            facturesEnRetard: 0,
        };
    });

    structures.forEach(s => {
        const quartierStats = stats[s.quartier];
        if (quartierStats) {
            quartierStats.totalStructures++;
            
            const facturesStructure = factures.filter(f => f.structureId === s.id);
            quartierStats.totalFactures += facturesStructure.length;
            
            facturesStructure.forEach(f => {
                quartierStats.montantTotal += f.montant;
                if (f.statut === 'payée') {
                    quartierStats.montantPaye += f.montant;
                } else {
                    quartierStats.montantImpaye += f.montant;
                    if (f.statut === 'en retard') {
                        quartierStats.facturesEnRetard++;
                    }
                }
            });
        }
    });

    // Rendu des cartes
    let dashboardHTML = '';
    
    quartiers.forEach(q => {
        const stat = stats[q.nom] || {
            totalStructures: 0,
            totalFactures: 0,
            montantTotal: 0,
            montantPaye: 0,
            montantImpaye: 0,
            facturesEnRetard: 0,
        };

        dashboardHTML += `
            <div class="quartier-card" onclick="showQuartierFactures('${q.nom}')" style="cursor: pointer;">
                <h3>📍 ${q.nom}</h3>
                <div class="stat-row">
                    <span class="stat-label">Structures:</span>
                    <span class="stat-value">${stat.totalStructures}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Total factures:</span>
                    <span class="stat-value">${stat.totalFactures}</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Montant total:</span>
                    <span class="stat-value montant-total">${formatMontant(stat.montantTotal)} FCFA</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Montant impayé:</span>
                    <span class="stat-value montant-impaye">${formatMontant(stat.montantImpaye)} FCFA</span>
                </div>
                <div class="stat-row">
                    <span class="stat-label">Factures en retard:</span>
                    <span class="stat-value" style="color: var(--danger-color);">${stat.facturesEnRetard}</span>
                </div>
                <div style="text-align: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid #e2e8f0;">
                    <span style="color: var(--primary-color); font-weight: 600; font-size: 0.9em;">👁️ Cliquer pour voir les factures</span>
                </div>
            </div>
        `;
    });

    if (quartiers.length === 0) {
        dashboardHTML = '<p style="color: #718096; text-align: center; padding: 20px;">Veuillez configurer des quartiers pour voir le tableau de bord.</p>';
    }
    
    dashboardGrid.innerHTML = dashboardHTML;
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

    // Fermer toute autre modale ouverte (y compris la modale de vue unique)
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('show');
        setTimeout(() => m.remove(), 300);
    });

    // Calculer les statistiques
    const structuresQuartier = structures.filter(s => s.quartier === quartier);
    const montantTotal = facturesQuartier.reduce((sum, f) => sum + f.montant, 0);
    const montantPaye = facturesQuartier
        .filter((f) => f.statut === "payée")
        .reduce((sum, f) => sum + f.montant, 0);
    const montantImpaye = facturesQuartier
        .filter((f) => f.statut !== "payée")
        .reduce((sum, f) => sum + f.montant, 0);

    // Créer une fenêtre modale
    const modal = document.createElement("div");
    modal.classList.add("modal"); // Classe CSS pour le fond
    modal.id = 'quartierFacturesModal'; // ID unique

    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content"); // Utilise la classe par défaut
    // La classe CSS cible l'ID de la modale pour le rendre large: #quartierFacturesModal .modal-content

    // Remplir le contenu de la modale en utilisant les classes CSS
    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>📍 Factures du quartier ${quartier}</h2>
            <button onclick="document.getElementById('quartierFacturesModal').remove()" class="btn-primary" style="background: var(--danger-color); font-size: 1.1em;">✖ Fermer</button>
        </div>

        <div class="modal-stats-grid">
            <div>
                <div>Structures suivies</div>
                <div class="stat-value-blue">${structuresQuartier.length}</div>
            </div>
            <div>
                <div>Total factures</div>
                <div>${facturesQuartier.length}</div>
            </div>
            <div>
                <div>Montant total</div>
                <div class="stat-value-blue">${formatMontant(montantTotal)} FCFA</div>
            </div>
            <div>
                <div>Montant payé</div>
                <div class="stat-value-green">${formatMontant(montantPaye)} FCFA</div>
            </div>
            <div>
                <div>Montant impayé</div>
                <div class="stat-value-red">${formatMontant(montantImpaye)} FCFA</div>
            </div>
        </div>

        <div class="modal-table-container">
            <table>
                <thead>
                    <tr>
                        <th style="width: 100px;">Numéro</th>
                        <th style="width: 150px;">Structure</th>
                        <th>Description</th>
                        <th class="text-right" style="width: 120px;">Montant</th>
                        <th class="text-center" style="width: 100px;">Échéance</th>
                        <th class="text-center" style="width: 100px;">Statut</th>
                        <th class="text-center" style="width: 100px;">Actions</th>
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
                            <tr>
                                <td><strong>${facture.numero}</strong></td>
                                <td>${structure ? structure.nom : "N/A"}</td>
                                <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                    ${facture.description || "-"}
                                </td>
                                <td class="text-right"><strong>${formatMontant(facture.montant)} FCFA</strong></td>
                                <td class="text-center">${formatDate(facture.dateEcheance)}</td>
                                <td class="text-center">
                                    <span class="status-badge ${statusClass}">${capitalizeFirst(facture.statut)}</span>
                                </td>
                                <td class="text-center">
                                    <button class="btn-edit" onclick="event.stopPropagation(); viewFacture(${facture.id});" title="Voir/Imprimer" style="margin-right: 5px;">👁️</button>
                                </td>
                            </tr>
                        `;
                    })
                    .join("")}
                </tbody>
            </table>
        </div>
    `;

    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // Animation : Ajouter la classe 'show' pour l'affichage avec transition CSS
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Fermer la modale en cliquant à l'extérieur
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            modal.classList.remove('show');
            setTimeout(() => modal.remove(), 300); // Attendre la fin de l'animation
        }
    });
}

// ===============================================
// UTILITAIRES & LOGIQUE UI
// ===============================================

function formatMontant(montant) {
    if (isNaN(montant)) return '0';
    return new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(montant);
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date)) return 'Date invalide';
    return date.toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function capitalizeFirst(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`.tab-btn[onclick="switchTab('${tabId}')"]`).classList.add('active');
    
    // Fermer toutes les modales ouvertes avant de changer d'onglet
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('show');
        setTimeout(() => m.remove(), 300);
    });
    
    // Rafraîchir le rendu à chaque changement d'onglet
    if (tabId === 'structures') {
        renderStructures();
    } else if (tabId === 'factures') {
        renderFactures();
    } else if (tabId === 'configuration') {
        renderQuartiers();
    } else if (tabId === 'dashboard') {
        updateDashboard();
    }
}


// *** Modale de Facture (Vue/Imprimer) ***

function generateFactureHTML(facture, structure) {
    const totalRow = calculateFactureTotalFromData(facture);
    
    // Génération du contenu HTML de la facture pour la modale
    return `
        <div class="modal-header">
            <h2 style="color: var(--primary-color);">FACTURE N° ${facture.numero}</h2>
            <div class="modal-actions">
                <button onclick="printFactureDetails()" class="btn-primary" style="background: var(--accent-color); margin-right: 10px;">🖨️ Imprimer</button>
                <button onclick="closeFactureModal()" class="btn-primary" style="background: var(--danger-color); font-size: 1.1em;">✖ Fermer</button>
            </div>
        </div>
        
        <div id="factureDetailsContent">
            <div class="facture-header-print" style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid var(--primary-color); padding-bottom: 10px;">
                <h3 style="color: var(--primary-color);">Émise le ${formatDate(facture.dateEmission)} - Échéance: ${formatDate(facture.dateEcheance)}</h3>
                
                </div>

            <div style="display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 0.9em;">
                <div>
                    <h4 style="color: var(--secondary-color);">Émetteur (Votre Organisation)</h4>
                    <p>Nom de l'entreprise</p>
                    <p>Adresse, Ville</p>
                    <p>Tel: 00 00 00 00</p>
                </div>
                <div>
                    <h4 style="color: var(--secondary-color);">Client</h4>
                    <p><strong>${structure ? structure.nom : "Structure Inconnue"}</strong></p>
                    <p>${structure ? structure.adresse : "N/A"}</p>
                    <p>${structure ? structure.quartier : "N/A"}</p>
                </div>
            </div>

            <h4 style="margin-bottom: 10px; color: var(--text-dark);">Description: ${facture.description || 'N/A'}</h4>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #EDF2F7;">
                        <th style="padding: 10px; border: 1px solid #CBD5E0;">Désignation</th>
                        <th style="padding: 10px; border: 1px solid #CBD5E0; text-align: right;">Qté</th>
                        <th style="padding: 10px; border: 1px solid #CBD5E0; text-align: right;">Prix Unit.</th>
                        <th style="padding: 10px; border: 1px solid #CBD5E0; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${facture.articles.map(a => `
                        <tr>
                            <td style="padding: 10px; border: 1px solid #CBD5E0;">${a.designation}</td>
                            <td style="padding: 10px; border: 1px solid #CBD5E0; text-align: right;">${a.quantite}</td>
                            <td style="padding: 10px; border: 1px solid #CBD5E0; text-align: right;">${formatMontant(a.prix)}</td>
                            <td style="padding: 10px; border: 1px solid #CBD5E0; text-align: right;">${formatMontant(a.quantite * a.prix)}</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr><td colspan="3" style="padding: 10px; text-align: right; font-weight: 600;">Sous-total HT:</td><td style="padding: 10px; text-align: right; border: 1px solid #CBD5E0;">${formatMontant(totalRow.subTotal)} FCFA</td></tr>
                    <tr><td colspan="3" style="padding: 10px; text-align: right; font-weight: 600;">TVA (${facture.tva}%):</td><td style="padding: 10px; text-align: right; border: 1px solid #CBD5E0;">${formatMontant(totalRow.tvaAmount)} FCFA</td></tr>
                    <tr><td colspan="3" style="padding: 10px; text-align: right; font-weight: 600;">Remise (${facture.remise}%):</td><td style="padding: 10px; text-align: right; border: 1px solid #CBD5E0;">-${formatMontant(totalRow.remiseAmount)} FCFA</td></tr>
                    <tr style="background-color: var(--primary-color); color: white;">
                        <td colspan="3" style="padding: 12px; text-align: right; font-weight: 700;">TOTAL TTC:</td>
                        <td style="padding: 12px; text-align: right; font-weight: 700;">${formatMontant(totalRow.total)} FCFA</td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top: 30px; padding: 15px; background: #F7FAFC; border: 1px solid #EDF2F7; border-radius: 5px;">
                <h4 style="color: var(--secondary-color); margin-bottom: 5px;">Notes / Conditions:</h4>
                <p style="font-size: 0.9em; white-space: pre-wrap;">${facture.notes || 'Paiement à réception de la facture.'}</p>
            </div>
        </div>
    `;
}

function viewFacture(id) {
    const facture = factures.find(f => f.id === id);
    if (!facture) {
        alert("Facture non trouvée.");
        return;
    }
    
    const structure = structures.find(s => s.id === facture.structureId);
    
    const factureContent = generateFactureHTML(facture, structure);
    
    // 1. Fermer toute autre modale ouverte (y compris la modale de quartier)
    document.querySelectorAll('.modal').forEach(m => {
        m.classList.remove('show');
        setTimeout(() => m.remove(), 300);
    });
    
    // 2. Création de la nouvelle modale de vue
    const modal = document.createElement("div");
    modal.classList.add("modal"); 
    modal.id = 'factureViewModal'; // ID unique pour la modale de vue
    
    const modalContent = document.createElement("div");
    modalContent.classList.add("modal-content"); // Utilise la taille par défaut (plus petite)
    modalContent.innerHTML = factureContent;
    
    modal.appendChild(modalContent);
    document.body.appendChild(modal);

    // 3. Animation et fermeture
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);

    // Fermeture de la modale en cliquant à l'extérieur
    modal.addEventListener("click", function (e) {
        if (e.target === modal) {
            closeFactureModal();
        }
    });
}

function closeFactureModal() {
    const modal = document.getElementById('factureViewModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300); // Destruction après l'animation
    }
}

function printFactureDetails() {
    // Le CSS gère l'affichage en mode impression
    window.print();
}

// ===============================================
// EXPOSITION DES FONCTIONS ET DÉMARRAGE 
// ===============================================

async function initApp() {
    try {
        await openDB();
        await loadData();
        
        // Mettre à jour l'UI après le chargement des données
        updateDashboard();
        renderStructures();
        renderFactures();
        renderQuartiers();
        updateStructureSelect();
        updateAllQuartiersSelects();
        
        // S'assurer que le premier onglet actif est affiché
        switchTab('dashboard'); 

    } catch (e) {
        console.error("Erreur critique lors de l'initialisation de l'application:", e);
        alert("Une erreur est survenue lors du chargement de la base de données. Veuillez vérifier la console."); 
    }
}






// Exposer les fonctions au scope global (window) pour l'appel depuis l'HTML
window.switchTab = switchTab;
window.showStructureForm = showStructureForm;
window.saveStructure = saveStructure;
window.cancelStructureForm = cancelStructureForm;
window.deleteStructure = deleteStructure;
window.filterStructures = filterStructures;

window.showQuartierForm = showQuartierForm;
window.saveQuartier = saveQuartier;
window.cancelQuartierForm = cancelQuartierForm;
window.deleteQuartier = deleteQuartier;
window.resetToDefaultQuartiers = resetToDefaultQuartiers;

window.showFactureForm = showFactureForm;
window.editFacture = editFacture;
window.saveFacture = saveFacture;
window.cancelFactureForm = cancelFactureForm;
window.deleteFacture = deleteFacture;
window.markFactureAsPaid = markFactureAsPaid; 

window.addArticle = addArticle;
window.removeArticle = removeArticle;
window.calculateFactureTotal = calculateFactureTotal;

window.viewFacture = viewFacture; 
window.closeFactureModal = closeFactureModal; 
window.printFactureDetails = printFactureDetails; 
window.showQuartierFactures = showQuartierFactures; 

// Lancer l'initialisation après le chargement du DOM
document.addEventListener("DOMContentLoaded", initApp);