function carregarFreezersStatus() {
    const statusContainer = document.querySelector(".status-freezer-inner");

    if (!statusContainer) {
        console.error("Elemento .status-freezer-inner não encontrado.");
        return;
    }

    statusContainer.innerHTML = ""; // Limpa qualquer conteúdo existente

    const statusRef = firebase.database().ref("freezers_status");
    statusRef.once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();

            // Cria o elemento 'freezer-card'
            const freezerCard = document.createElement("div");
            freezerCard.classList.add("freezer-card");

            // Determina a cor do indicador de status com base nas condições de temperatura
            let statusColor = "gray"; // Cor padrão para quando a temperatura está vazia
            if (freezer.temperaturaAtual !== "" && freezer.temperaturaAtual !== undefined) {
                const tempAtual = parseFloat(freezer.temperaturaAtual);
                const tempMin = parseFloat(freezer.tempMin);
                const tempMax = parseFloat(freezer.tempMax);

                // Verifica se os valores de temperatura são válidos
                if (!isNaN(tempAtual) && !isNaN(tempMin) && !isNaN(tempMax)) {
                    if (tempAtual >= tempMin && tempAtual <= tempMax) {
                        statusColor = "green"; // Dentro do intervalo
                    } else {
                        statusColor = "red"; // Fora do intervalo
                    }
                }
            }

            // Monta o conteúdo do 'freezer-card' com o símbolo °C
            freezerCard.innerHTML = `
                <div>
                    <div class="status-indicator ${statusColor}"></div>
                    <span>${freezer.id}</span>
                </div>
                <div class="temperature">${freezer.temperaturaAtual ? `${freezer.temperaturaAtual}°C` : "N/A"}</div>
            `;

            // Adiciona o 'freezer-card' ao container interno
            statusContainer.appendChild(freezerCard);
        });
    });
}

// Chame a função quando a página for carregada
window.onload = function() {
    carregarFreezersStatus();
};