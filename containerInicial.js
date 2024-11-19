let clickInterval;
let isPaused = false;
let pauseTimeout;
let currentCardIndex = 0;
let notificationCount = 0;
let notificationMessages = []; 

function carregarFreezersStatus() {
    const statusContainer = document.querySelector(".status-freezer-inner");
    const freezersLigadosElement = document.getElementById("freezers-ligados");
    const freezersDesligadosElement = document.getElementById("freezers-desligados");

    if (!statusContainer) {
        console.error("Elemento .status-freezer-inner não encontrado.");
        return;
    }

    // Limpa o conteúdo do container e inicializa variáveis novamente
    statusContainer.innerHTML = ""; 
    notificationMessages = []; 

    const statusRef = firebase.database().ref("freezers_status");
    const freezersRef = firebase.database().ref("freezers");

    freezersRef.once("value", function(freezersSnapshot) {
        const dataCadastroMap = {};

        freezersSnapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();
            dataCadastroMap[freezer.id] = freezer.dataCadastro || "Data não disponível";
        });

        statusRef.once("value", function(snapshot) {
            let countLigados = 0;
            let countDesligados = 0;

            // Aqui não há necessidade de recriar freezersArray fora deste escopo
            const freezersArray = [];

            snapshot.forEach(function(childSnapshot) {
                const freezer = childSnapshot.val();
                freezer.dataCadastro = dataCadastroMap[freezer.id] || "Data não disponível";
                freezersArray.push(freezer);
            });

            freezersArray.sort((a, b) => {
                const colorOrder = { "gray": 1, "red": 2, "yellow": 3, "green": 4 };
                const statusA = determineStatusColor(a);
                const statusB = determineStatusColor(b);
                return colorOrder[statusA] - colorOrder[statusB];
            });

            freezersArray.forEach(freezer => {
                const freezerCard = document.createElement("div");
                freezerCard.classList.add("freezer-card");
                freezerCard.dataset.dataCadastro = freezer.dataCadastro;

                let statusColor = determineStatusColor(freezer);

                if (statusColor === "gray") {
                    countDesligados++;
                    notificationMessages.push(`Freezer ${freezer.id} está desligado.`);
                } else if (statusColor === "red") {
                    notificationMessages.push(`Freezer ${freezer.id} está fora do intervalo!`);
                    countLigados++;
                } else {
                    countLigados++;
                }

                freezerCard.innerHTML = `
                    <div>
                        <div class="status-indicator ${statusColor}"></div>
                        <span>${freezer.id}</span>
                    </div>
                    <div class="temperature">${freezer.temperaturaAtual !== undefined && freezer.temperaturaAtual !== null && freezer.temperaturaAtual !== "" ? `${freezer.temperaturaAtual}°C` : "N/A"}</div>
                `;

                freezerCard.addEventListener("click", function() {
                    document.querySelectorAll(".freezer-card").forEach(c => c.classList.remove("active"));
                    freezerCard.classList.add("active");
                    carregarDetalhesFreezer(freezer.id);
                    pausarEContinuarClickAutomatico();
                });

                statusContainer.appendChild(freezerCard);
            });

            freezersLigadosElement.textContent = countLigados;
            freezersDesligadosElement.textContent = countDesligados;

            notificationCount = notificationMessages.length;
            showNotifications(notificationCount);
            updateNotificationPopup();
            iniciarClickAutomatico();
        });
    });
}

// Função auxiliar para determinar a cor do status
function determineStatusColor(freezer) {
    if (freezer.temperaturaAtual !== "" && freezer.temperaturaAtual !== undefined && freezer.temperaturaAtual !== null) {
        const tempAtual = parseFloat(freezer.temperaturaAtual);
        const tempMin = parseFloat(freezer.tempMin);
        const tempMax = parseFloat(freezer.tempMax);

        if (!isNaN(tempAtual) && !isNaN(tempMin) && !isNaN(tempMax)) {
            return (tempAtual >= tempMin && tempAtual <= tempMax) ? "green" : "red";
        }
    }
    return "gray"; // Freezer desligado por padrão
}

// Função carregarDetalhesFreezer permanece a mesma
function carregarDetalhesFreezer(freezerId) {
    const detailsSection = document.querySelector(".details-section");

    if (!detailsSection) {
        console.error("Elemento .details-section não encontrado.");
        return;
    }

    // Atualiza o cabeçalho da seção
    detailsSection.querySelector(".details-header").innerText = `${freezerId} - Histórico`;

    // Referência ao nó `freezers_status`
    firebase.database().ref(`freezers_status/${freezerId}`).once("value", function(snapshot) {
        const freezerData = snapshot.val();

        if (freezerData) {
            const temperaturaAtual = parseFloat(freezerData.temperaturaAtual) || "N/A";
            const tempMin = parseFloat(freezerData.tempMin) || "N/A";
            const tempMax = parseFloat(freezerData.tempMax) || "N/A";

            const tempElement = detailsSection.querySelector(".temperature");
            if (tempElement) {
                tempElement.innerHTML = `<b>Temperatura atual: ${temperaturaAtual}°C</b>`;
            }

            const detailsContentP = detailsSection.querySelector(".details-content p");
            if (detailsContentP) {
                let statusMessage = "Verifique os alertas";
                if (temperaturaAtual !== "N/A" && tempMin !== "N/A" && tempMax !== "N/A") {
                    if (temperaturaAtual < tempMin) {
                        statusMessage = "Temperatura abaixo do esperado, verifique os alertas";
                    } else if (temperaturaAtual > tempMax) {
                        statusMessage = "Temperatura acima do esperado, verifique os alertas";
                    } else {
                        statusMessage = "Tudo sob controle";
                    }
                }

                detailsContentP.innerHTML = `
                    Min ${tempMin}°C - Max ${tempMax}°C - 
                    <b>${statusMessage}</b>
                `;
            }

            // Configurar listener no nó `freezers_historico`
            const historicoRef = firebase.database().ref(`freezers_historico/${freezerId}`);
            historicoRef.on("value", function(snapshot) {
                const tbody = detailsSection.querySelector("table tbody");

                if (!tbody) {
                    console.error("Elemento <tbody> não encontrado.");
                    return;
                }

                tbody.innerHTML = ""; // Limpa os registros antigos
                const historicoEntries = [];

                // Obter subnós `data`, `hora` e `temp`
                const data = snapshot.child("data").val() || {};
                const hora = snapshot.child("hora").val() || {};
                const temp = snapshot.child("temperatura").val() || {};

                // Iterar sobre os índices numéricos
                Object.keys(data).forEach((key) => {
                    const temperatura = temp[key] || "N/A";
                    const dataRegistro = data[key] || "N/A";
                    const horaRegistro = hora[key] || "N/A";

                    historicoEntries.push({ data: dataRegistro, hora: horaRegistro, temperatura });
                });

                // Ordena do mais recente para o mais antigo
                historicoEntries.sort((a, b) => {
                    const dateTimeA = new Date(`${a.data.split('/').reverse().join('-')} ${a.hora}`);
                    const dateTimeB = new Date(`${b.data.split('/').reverse().join('-')} ${b.hora}`);
                    return dateTimeB - dateTimeA; // Ordem decrescente
                });

                // Preenche a tabela com os registros
                historicoEntries.forEach((entry) => {
                    const row = document.createElement("tr");
                    row.innerHTML = `
                        <td>${entry.data}</td>
                        <td>${entry.hora}</td>
                        <td>${entry.temperatura}°C</td>
                        <td>${freezerId}</td>
                    `;

                    // Destacar temperaturas fora do intervalo
                    if (entry.temperatura !== "N/A" && freezerData) {
                        const tempAtual = parseFloat(entry.temperatura);
                        if (!isNaN(tempAtual)) {
                            const tempMin = parseFloat(freezerData.tempMin);
                            const tempMax = parseFloat(freezerData.tempMax);
                            if (tempAtual < tempMin || tempAtual > tempMax) {
                                row.style.backgroundColor = "rgba(255, 0, 0, 0.2)";
                            }
                        }
                    }

                    tbody.appendChild(row);
                });
            });
        } else {
            console.error(`Dados do freezer ${freezerId} não encontrados no Firebase.`);
        }
    });
}

setInterval(() => {
    carregarFreezersStatus(); // Atualiza a lista de status dos freezers

    // Atualiza detalhes do freezer atualmente ativo, se houver
    const activeCard = document.querySelector(".freezer-card.active");
    if (activeCard) {
        const activeFreezerId = activeCard.querySelector("span").textContent;
        carregarDetalhesFreezer(activeFreezerId);
    }

    // Atualiza as temperaturas nos cards
    const statusRef = firebase.database().ref("freezers_status");
    statusRef.once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();
            const card = document.querySelector(`.freezer-card span:contains("${freezer.id}")`)?.parentElement;

            if (card) {
                const temperatureDiv = card.querySelector(".temperature");
                if (temperatureDiv) {
                    temperatureDiv.textContent = freezer.temperaturaAtual !== undefined && freezer.temperaturaAtual !== null && freezer.temperaturaAtual !== "" 
                        ? `${freezer.temperaturaAtual}°C` 
                        : "N/A";
                }
            }
        });
    });

    // Atualiza as notificações
    updateNotificationPopup();
    showNotifications(notificationMessages.length);
}, 3.1 * 60 * 1000);


function iniciarClickAutomatico() {
    // Certifica-se de que existem cards antes de iniciar o clique automático
    const freezerCards = document.querySelectorAll(".freezer-card");
    if (freezerCards.length === 0) {
        console.warn("Nenhum card encontrado. Tentando novamente em 1 segundo...");
        setTimeout(iniciarClickAutomatico, 1000); // Tenta novamente após 1 segundo
        return;
    }

    simularCliqueNoCard();

    clickInterval = setInterval(() => {
        console.log("Executando intervalo de 3 segundos"); // Mantém o intervalo reduzido para testes
        if (!isPaused) {
            simularCliqueNoCard();
        }
    }, 30000);
}


// Função para simular o clique em um card específico
function simularCliqueNoCard() {
    const freezerCards = document.querySelectorAll(".freezer-card");

    if (freezerCards.length > 0) {
        freezerCards.forEach(c => c.classList.remove("active"));
        
        const card = freezerCards[currentCardIndex];
        card.classList.add("active");
        console.log("Exibindo card index:", currentCardIndex); // Verifica o índice atual
        
        carregarDetalhesFreezer(card.querySelector("span").textContent); // Chama diretamente a função para carregar detalhes
        
        currentCardIndex = (currentCardIndex + 1) % freezerCards.length;
    }
}



// Função para pausar o clique automático por 10 minutos e depois retomar
function pausarEContinuarClickAutomatico() {
    clearInterval(clickInterval); // Pausa o clique automático
    isPaused = true;

    // Limpa o timeout anterior, caso exista
    if (pauseTimeout) clearTimeout(pauseTimeout);

    // Define a pausa de 10 minutos
    pauseTimeout = setTimeout(() => {
        isPaused = false;
        iniciarClickAutomatico(); // Retoma o clique automático após 10 minutos
    }, 600000); // 10 minutos em milissegundos
}

// Adiciona o evento de clique para pausar o clique automático
document.addEventListener("click", (event) => {
    if (event.target.closest(".freezer-card")) {
        pausarEContinuarClickAutomatico();
    }
});

// Inicia o clique automático ao carregar a página
window.onload = function() {
    carregarFreezersStatus(); // Chama apenas carregarFreezersStatus
};

document.getElementById('notificationIcon').addEventListener('click', function() {
    const popup = document.getElementById('notificationPopup');
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
});

// Ocultar o popup se clicar fora dele
document.addEventListener('click', function(event) {
    const notificationIcon = document.getElementById('notificationIcon');
    const popup = document.getElementById('notificationPopup');
    if (!notificationIcon.contains(event.target) && !popup.contains(event.target)) {
        popup.style.display = 'none';
    }
});

function updateNotificationPopup() {
    const popup = document.getElementById('notificationPopup');
    popup.innerHTML = ''; // Limpa as notificações antigas

    if (notificationMessages.length > 0) {
        notificationMessages.forEach((message) => {
            const p = document.createElement("p");
            p.textContent = message;
            popup.appendChild(p);
        });
    } else {
        const p = document.createElement("p");
        p.textContent = "Não há mensagens pendentes.";
        popup.appendChild(p);
    }
}

function showNotifications(count) {
    const notificationIcon = document.getElementById('notificationIcon');
    const notificationCountElement = document.getElementById('notificationCount');

    if (count > 0) {
        notificationIcon.classList.add('has-notifications'); // Ativa o tremor
        console.log("Classe 'has-notifications' adicionada");
        notificationCountElement.textContent = count; // Define o número de notificações
        notificationCountElement.style.display = 'inline'; // Exibe a bolinha
    } else {
        notificationIcon.classList.remove('has-notifications'); // Remove o tremor
        console.log("Classe 'has-notifications' removida");
        notificationCountElement.style.display = 'none'; // Oculta a bolinha
    }
}


// Adiciona eventos de alteração para filtro e ordenação
document.getElementById("filterSelect").addEventListener("change", () => {
    aplicarFiltro();
    aplicarOrdenacao(); // Reaplica a ordenação após o filtro
});

document.getElementById("sortSelect").addEventListener("change", () => {
    aplicarOrdenacao();
});

// Função para aplicar o filtro sem desalinhar os cards
function aplicarFiltro() {
    const filterValue = document.getElementById("filterSelect").value;
    const freezerCards = document.querySelectorAll(".freezer-card");

    freezerCards.forEach(card => {
        const statusIndicator = card.querySelector(".status-indicator");
        const statusColor = statusIndicator ? statusIndicator.classList[1] : "";

        if (filterValue === "all" || statusColor === filterValue) {
            // Exibe o card
            card.style.display = "flex";
        } else {
            // Oculta o card
            card.style.display = "none";
        }
    });
}

function aplicarOrdenacao() {
    const sortValue = document.getElementById("sortSelect").value;
    const freezerCards = Array.from(document.querySelectorAll(".freezer-card"));

    // Exibe o valor de dataCadastro antes da ordenação
    console.log("Antes da ordenação:", freezerCards.map(card => ({
        id: card.querySelector("span").textContent,
        dataCadastro: card.dataset.dataCadastro
    })));

    // Ordena a lista de cards temporariamente com base no valor selecionado
    switch (sortValue) {
        case "a-z":
            freezerCards.sort((a, b) => a.querySelector("span").textContent.localeCompare(b.querySelector("span").textContent));
            break;
        case "z-a":
            freezerCards.sort((a, b) => b.querySelector("span").textContent.localeCompare(a.querySelector("span").textContent));
            break;
        case "most-recent":
            freezerCards.sort((a, b) => {
                // Cria objetos de data e hora
                const dateA = new Date(a.dataset.dataCadastro);
                const dateB = new Date(b.dataset.dataCadastro);
                if (dateA.getTime() === dateB.getTime()) {
                    // Critério de desempate: ordena por ID
                    return a.querySelector("span").textContent.localeCompare(b.querySelector("span").textContent);
                }
                return dateB - dateA; // Ordem decrescente (mais recente primeiro)
            });
            break;
        case "oldest":
            freezerCards.sort((a, b) => {
                // Cria objetos de data e hora
                const dateA = new Date(a.dataset.dataCadastro);
                const dateB = new Date(b.dataset.dataCadastro);
                if (dateA.getTime() === dateB.getTime()) {
                    // Critério de desempate: ordena por ID
                    return a.querySelector("span").textContent.localeCompare(b.querySelector("span").textContent);
                }
                return dateA - dateB; // Ordem crescente (mais antigo primeiro)
            });
            break;
        case "temperature-asc":
            freezerCards.sort((a, b) => parseFloat(a.querySelector(".temperature").textContent) - parseFloat(b.querySelector(".temperature").textContent));
            break;
        case "temperature-desc":
            freezerCards.sort((a, b) => parseFloat(b.querySelector(".temperature").textContent) - parseFloat(a.querySelector(".temperature").textContent));
            break;
        case "status":
            const colorOrder = { "gray": 1, "red": 2, "yellow": 3, "green": 4 };
            freezerCards.sort((a, b) => colorOrder[a.querySelector(".status-indicator").classList[1]] - colorOrder[b.querySelector(".status-indicator").classList[1]]);
            break;
    }

    // Exibe o valor de dataCadastro após a ordenação
    console.log("Depois da ordenação:", freezerCards.map(card => ({
        id: card.querySelector("span").textContent,
        dataCadastro: card.dataset.dataCadastro
    })));

    // Aplica visualmente a ordem usando `order` (sem mexer na estrutura do DOM)
    freezerCards.forEach((card, index) => {
        card.style.order = index;
    });
}


// Chamadas dos filtros e ordenações ao carregar a página
window.onload = function() {
    carregarFreezersStatus();
    aplicarFiltro();
    aplicarOrdenacao();
};

