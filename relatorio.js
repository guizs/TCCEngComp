document.addEventListener("DOMContentLoaded", () => {
    const freezerSelect = document.getElementById("freezerSelect");

    // Função para obter os IDs dos freezers do Firebase e adicioná-los ao select
    firebase.database().ref('freezers_historico').once('value')
        .then(snapshot => {
            snapshot.forEach(childSnapshot => {
                const freezerID = childSnapshot.key;
                const option = document.createElement("option");
                option.value = freezerID;
                option.textContent = freezerID;
                freezerSelect.appendChild(option);
            });
        })
        .catch(error => console.error("Erro ao carregar freezers:", error));
});

// Função para baixar o relatório em formato CSV
document.getElementById("downloadCsvBtn").addEventListener("click", () => {
    downloadReport("csv");
});

// Função para baixar o relatório em formato XLSX
document.getElementById("downloadExcelBtn").addEventListener("click", () => {
    downloadReport("xlsx");
});

let userEmail = null;

// Obter o e-mail do usuário logado
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        userEmail = user.email;
    } else {
        alert("Usuário não autenticado.");
    }
});

// Função principal para gerar e baixar o relatório
function downloadReport(format) {
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;
    const selectedFreezers = Array.from(document.getElementById("freezerSelect").selectedOptions).map(option => option.value);

    if (!startDate || !endDate || selectedFreezers.length === 0) {
        alert("Por favor, selecione o intervalo de datas e ao menos um freezer.");
        return;
    }

    const freezerData = [];
    let freezersProcessed = 0;

    selectedFreezers.forEach(freezerID => {
        firebase.database().ref(`freezers_historico/${freezerID}`).once('value')
            .then(snapshot => {
                snapshot.child("data").forEach(dataSnapshot => {
                    const timestamp = dataSnapshot.key;
                    const date = dataSnapshot.val();
                    const hour = snapshot.child("hora").child(timestamp).val();
                    const temp = snapshot.child("temperatura").child(timestamp).val();

                    if (date >= startDate && date <= endDate) {
                        freezerData.push({
                            "Freezer ID": freezerID,
                            "Data": date,
                            "Hora": hour,
                            "Temperatura °C": temp
                        });
                    }
                });

                freezersProcessed++;

                // Após processar todos os freezers, gerar o arquivo ou enviar o e-mail
                if (freezersProcessed === selectedFreezers.length) {
                    if (freezerData.length > 0) {
                        if (format === "csv") {
                            generateCSVReport(freezerData);
                        } else if (format === "xlsx") {
                            generateExcelReport(freezerData);
                        } else if (format === "email") {
                            sendEmailReport(freezerData);
                        }
                    } else {
                        alert("Nenhum dado encontrado para o período e freezers selecionados.");
                    }
                }
            })
            .catch(error => console.error("Erro ao buscar dados:", error));
    });
}

// Função para gerar e baixar o relatório em CSV
function generateCSVReport(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);

    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "relatorio_freezers.csv";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Função para gerar e baixar o relatório em XLSX
function generateExcelReport(data) {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório Freezers");

    XLSX.writeFile(workbook, "relatorio_freezers.xlsx");
}

// Função para enviar o relatório por e-mail
function sendEmailReport(data) {
    console.log("Enviando relatório para o e-mail:", userEmail); // Log para verificar o e-mail

    fetch("https://your-backend-server.com/send-email", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            email: userEmail,
            data: data,
        }),
    })
    .then(response => response.json())
    .then(responseData => {
        if (responseData.success) {
            alert("Relatório enviado com sucesso!");
        } else {
            alert("Erro ao enviar o relatório.");
        }
    })
    .catch(error => console.error("Erro ao enviar e-mail:", error));
}