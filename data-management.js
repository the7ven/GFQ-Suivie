// ===============================================
// LOGIQUE D'IMPORT/EXPORT DE DONNÉES
// Ce fichier doit être chargé APRÈS main.js
// ===============================================

/**
 * Exporte l'intégralité de l'état (données) dans un fichier JSON.
 * S'appuie sur l'objet 'state' défini dans main.js.
 */
function exportData() {
    // Les variables et fonctions comme 'state' sont accessibles ici car main.js est chargé avant.
    const dataToExport = {
        quartiers: state.quartiers,
        structures: state.structures,
        factures: state.factures
        // Nous n'exportons pas les "lastId" car IndexedDB gère l'auto-increment.
    };
    
    const jsonString = JSON.stringify(dataToExport, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Créer un lien temporaire pour le téléchargement
    const a = document.createElement('a');
    a.href = url;
    a.download = `GFQ_Sauvegarde_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    alert('Exportation réussie ! Fichier de sauvegarde téléchargé.');
}

/**
 * Gère l'importation de données à partir du champ de fichier.
 */
function handleImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
        alert("Veuillez sélectionner un fichier de sauvegarde (.json) à importer.");
        return;
    }
    
    if (!confirm(`ATTENTION : L'importation du fichier "${file.name}" va SUPPRIMER et REMPLACER TOUTES vos données actuelles (structures, factures, quartiers) dans la base de données. Êtes-vous sûr de vouloir continuer ?`)) {
        return;
    }

    const reader = new FileReader();
    
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            importData(importedData);
        } catch (e) {
            console.error("Erreur lors de la lecture ou du parsage du fichier JSON:", e);
            alert("Erreur: Le fichier sélectionné n'est pas un fichier de sauvegarde GFQ valide ou le format est incorrect.");
        }
    };
    
    reader.onerror = () => {
        alert("Erreur lors de la lecture du fichier.");
    };
    
    reader.readAsText(file);
}

/**
 * Met à jour l'état de l'application et synchronise avec IndexedDB.
 * @param {object} importedData 
 */
async function importData(importedData) {
    if (!Array.isArray(importedData.quartiers) || !Array.isArray(importedData.structures) || !Array.isArray(importedData.factures)) {
        alert("Erreur: Le fichier ne contient pas toutes les données requises (quartiers, structures, factures) ou leur format est invalide.");
        return;
    }
    
    // Mise à jour de l'état en mémoire
    state.quartiers = importedData.quartiers;
    state.structures = importedData.structures;
    state.factures = importedData.factures;

    // Synchronisation avec IndexedDB (suppression + réinsertion)
    const success = await syncStateToDB();

    if (success) {
        // Rechargement complet de l'interface utilisateur
        renderAll(); // Note: Assurez-vous d'avoir une fonction renderAll() qui appelle switchTab('dashboard') et renderFactures/Structures/Quartiers
        switchTab('dashboard'); // Bascule vers le tableau de bord pour montrer le résultat
        
        alert("Importation réussie ! Les données ont été restaurées.");
    } else {
         alert("Échec de la restauration des données dans la base de données.");
    }
}


// Exposer les nouvelles fonctions au scope global pour l'appel depuis l'HTML
window.exportData = exportData;
window.handleImport = handleImport;