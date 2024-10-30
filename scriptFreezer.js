document.getElementById("cadastrarFreezer").addEventListener("click", function() {
    const marca = document.getElementById("marcaInput").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMinInput").value);
    const tempMax = parseFloat(document.getElementById("tempMaxInput").value);
    const messageElem = document.querySelector(".message p");

    // Limpa classes anteriores e conteúdo
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");

    // Verifica se os campos estão preenchidos
    if (!marca || isNaN(tempMin) || isNaN(tempMax)) {
        messageElem.textContent = "Por favor, preencha todos os campos.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Verifica os valores de temperatura
    if (tempMin > tempMax) {
        messageElem.textContent = "A temperatura mínima não pode ser maior que a temperatura máxima.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Mostra pop-up de confirmação
    document.getElementById("popupConfirm").style.display = "flex";
});

function cadastrarFreezer() {
    const marca = document.getElementById("marcaInput").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMinInput").value);
    const tempMax = parseFloat(document.getElementById("tempMaxInput").value);
    const messageElem = document.querySelector(".message p");
    const ref = firebase.database().ref("freezers");
    const counterRef = firebase.database().ref("counter");

    // Gera um novo ID usando o contador e salva o freezer na tabela "freezers"
    counterRef.transaction(function(currentCounter) {
        return (currentCounter || 0) + 1;
    }, function(error, committed, snapshot) {
        if (error) {
            messageElem.textContent = "Erro ao atualizar o contador: Contate o suporte.";
            messageElem.parentElement.classList.add("error");
            setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
            setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        } else if (committed) {
            const newId = snapshot.val();
            const brandCode = marca.substring(0, 4).toUpperCase();
            const fullId = brandCode + newId;

            // Adiciona na tabela "freezers"
            ref.child(newId).set({
                id: fullId,
                marca: marca,
                tempMin: tempMin,
                tempMax: tempMax,
                dataCadastro: new Date().toISOString()
            }, function(error) {
                if (error) {
                    messageElem.textContent = "Erro ao cadastrar o freezer: Contate o suporte.";
                    messageElem.parentElement.classList.add("error");
                    setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                } else {
                    // Cadastro na tabela "freezers" foi bem-sucedido
                    const statusRef = firebase.database().ref("freezers_status");

                    // Adiciona o freezer na tabela "freezers_status"
                    statusRef.child(newId).set({
                        id: fullId, // Mesmo ID
                        marca: marca,
                        tempMin: tempMin,
                        tempMax: tempMax,
                        temperaturaAtual: "", // Valor em branco
                        status: ""             // Valor em branco
                    }, function(error) {
                        if (error) {
                            messageElem.textContent = "Erro ao cadastrar o status do freezer.";
                            messageElem.parentElement.classList.add("error");
                        } else {
                            messageElem.textContent = "Freezer cadastrado com sucesso.";
                            sincronizarFreezersHistorico();
                            messageElem.parentElement.classList.add("success");
                            setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                            LimpacamposCadastro();
                            atualizarTabela(); // Atualiza a tabela sem recarregar a página
                            sincronizarFreezersStatus()
                            sincronizarFreezersHistorico() 
                        }
                    });
                }
                setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
            });
        }
    });
}

document.getElementById("alterarFreezer").addEventListener("click", function() {
    const inputId = document.getElementById("ID").value;
    const marca = document.getElementById("marca-alterar").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMin-alterar").value);
    const tempMax = parseFloat(document.getElementById("tempMax-alterar").value);
    const messageElem = document.querySelector(".message-alterar p");

    // Limpa classes anteriores e conteúdo
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");

    // Verifica se os campos estão preenchidos
    if (!inputId || !marca || isNaN(tempMin) || isNaN(tempMax)) {
        messageElem.textContent = "Por favor, preencha todos os campos.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Verifica os valores de temperatura
    if (tempMin > tempMax) {
        messageElem.textContent = "A temperatura mínima não pode ser maior que a temperatura máxima.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    // Mostra pop-up de confirmação
    document.getElementById("popupConfirm").style.display = "flex";
    atualizarTabela();
    sincronizarFreezersStatus()
    sincronizarFreezersHistorico() 
});

function alterarFreezer() {
    const inputId = document.getElementById("ID").value;
    const marca = document.getElementById("marca-alterar").value.toUpperCase(); // Transformar em maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMin-alterar").value);
    const tempMax = parseFloat(document.getElementById("tempMax-alterar").value);
    const messageElem = document.querySelector(".message-alterar p");

    // Verifica se os valores de temperatura são válidos números
    if (isNaN(tempMin) || isNaN(tempMax)) {
        messageElem.textContent = "Erro: Temperaturas devem ser números válidos.";
        messageElem.parentElement.classList.add("error");
        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
        setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        return;
    }

    const ref = firebase.database().ref("freezers");
    ref.once("value", function(snapshot) {
        let found = false;
        snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val().id === inputId) {
                found = true;
                const fullId = childSnapshot.val().id; // Mantém o ID completo original
                ref.child(childSnapshot.key).update({
                    id: fullId,
                    marca: marca,
                    tempMin: tempMin,
                    tempMax: tempMax,
                    dataAlteracao: new Date().toISOString()
                }, function(error) {
                    if (error) {
                        messageElem.textContent = "Erro ao alterar o freezer: Contate o suporte.";
                        messageElem.parentElement.classList.add("error");
                        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                    } else {
                        messageElem.textContent = "Freezer alterado com sucesso.";
                        messageElem.parentElement.classList.add("success");
                        setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
                        LimpacamposAlterar();
                    }
                    setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
                });
            }
        });
        if (!found) {
            messageElem.textContent = "ID não encontrado: Verifique o ID informado.";
            messageElem.parentElement.classList.add("error");
            setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10);
            setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        }
    });
}

function atualizarTabela() {
    const tabelaBody = document.querySelector("#freezersTable tbody");
    tabelaBody.innerHTML = ""; // Limpar a tabela antes de adicionar os resultados

    const ref = firebase.database().ref("freezers");

    ref.once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();
            const row = tabelaBody.insertRow();
            row.insertCell(0).textContent = freezer.id;
            row.insertCell(1).textContent = freezer.marca;
            row.insertCell(2).textContent = freezer.tempMin;
            row.insertCell(3).textContent = freezer.tempMax;
            row.insertCell(4).textContent = freezer.dataCadastro ? formatarData(freezer.dataCadastro) : "-";
            row.insertCell(5).textContent = freezer.dataAlteracao ? formatarData(freezer.dataAlteracao) : "-";
        });
    });
}


// Carrega os freezers ao carregar a página
window.onload = carregarFreezers;

window.onload = function() {
    carregarFreezers();
};

function LimpacamposCadastro() {
    document.getElementById('marcaInput').value = '';
    document.getElementById('tempMinInput').value = '';
    document.getElementById('tempMaxInput').value = '';
}


document.getElementById("confirmNo").addEventListener("click", function() {
    document.getElementById("popupConfirm").style.display = "none"; // Apenas esconde o pop-up
});

function formatarData(dataISO) {
    const data = new Date(dataISO);
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0'); // Janeiro é 0!
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

function carregarFreezers() {
    const ref = firebase.database().ref("freezers");
    ref.once("value", function(snapshot) {
        const tableBody = document.querySelector("#freezersTable tbody");
        tableBody.innerHTML = ""; // Limpa qualquer conteúdo existente na tabela

        snapshot.forEach(function(childSnapshot) {
            const data = childSnapshot.val();
            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${data.id}</td>
                <td>${data.marca}</td>
                <td>${data.tempMin} °C</td>
                <td>${data.tempMax} °C</td>
                <td>${formatarData(data.dataCadastro)}</td>
                <td>${data.dataAlteracao ? formatarData(data.dataAlteracao) : 'N/A'}</td>
            `;

            tableBody.appendChild(row);
        });
    });
}


function LimpacamposAlterar() {
    document.getElementById('ID').value = '';
    document.getElementById('marca-alterar').value = '';
    document.getElementById('tempMin-alterar').value = '';
    document.getElementById('tempMax-alterar').value = '';
}

document.getElementById("ID").addEventListener("input", function() {
    const inputId = document.getElementById("ID").value;
    const messageElem = document.querySelector(".message-alterar p");

    // Limpa mensagens anteriores
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");

    if (!inputId) {
        // Limpa o campo marca se o ID estiver vazio
        document.getElementById("marca-alterar").value = '';
        return;
    }

    const ref = firebase.database().ref("freezers");

    ref.once("value", function(snapshot) {
        let found = false;

        snapshot.forEach(function(childSnapshot) {
            if (childSnapshot.val().id === inputId) {
                found = true;
                const marca = childSnapshot.val().marca;
                document.getElementById("marca-alterar").value = marca;

                // Limpa mensagem se encontrada a marca
                messageElem.textContent = "";
                messageElem.parentElement.classList.remove("success", "error", "tremor");
            }
        });

        if (!found) {
            messageElem.textContent = "ID não encontrado: Verifique o ID informado.";
            messageElem.parentElement.classList.add("error");
            setTimeout(() => { messageElem.parentElement.classList.add("tremor"); }, 10); // Adiciona a classe de tremor com leve atraso
            setTimeout(() => { messageElem.parentElement.classList.remove("tremor"); }, 510);
        }
    });
});

document.getElementById("procurar").addEventListener("click", function() {
    const inputId = document.getElementById("ID-busca").value;
    const inputMarca = document.getElementById("marca-busca").value.toUpperCase();
    const tabelaBody = document.querySelector("#freezersTable tbody");
    tabelaBody.innerHTML = ""; // Limpar a tabela antes de adicionar os resultados

    const ref = firebase.database().ref("freezers");

    ref.once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();
            if ((inputId && freezer.id === inputId) || (inputMarca && freezer.marca === inputMarca)) {
                const row = tabelaBody.insertRow();
                row.insertCell(0).textContent = freezer.id;
                row.insertCell(1).textContent = freezer.marca;
                row.insertCell(2).textContent = freezer.tempMin;
                row.insertCell(3).textContent = freezer.tempMax;
                row.insertCell(4).textContent = freezer.dataCadastro ? formatarData(freezer.dataCadastro) : "-";
                row.insertCell(5).textContent = freezer.dataAlteracao ? formatarData(freezer.dataAlteracao) : "-";
            }
        });
    });

    limparCamposProcurar(); // Chama a função para limpar os campos após a busca
});

document.getElementById("limparFiltros").addEventListener("click", function() {
    limparCamposProcurar(); // Limpa os campos de busca
    const tabelaBody = document.querySelector("#freezersTable tbody");
    tabelaBody.innerHTML = ""; // Limpar a tabela antes de adicionar todos os resultados
    const ref = firebase.database().ref("freezers");

    ref.once("value", function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
            const freezer = childSnapshot.val();
            const row = tabelaBody.insertRow();
            row.insertCell(0).textContent = freezer.id;
            row.insertCell(1).textContent = freezer.marca;
            row.insertCell(2).textContent = freezer.tempMin;
            row.insertCell(3).textContent = freezer.tempMax;
            row.insertCell(4).textContent = freezer.dataCadastro ? formatarData(freezer.dataCadastro) : "-";
            row.insertCell(5).textContent = freezer.dataAlteracao ? formatarData(freezer.dataAlteracao) : "-";
        });
    });
});

function limparCamposProcurar() {
    document.getElementById("ID-busca").value = '';
    document.getElementById("marca-busca").value = '';
}

function carregarMarcas() {
    const marcasRef = firebase.database().ref("freezers");
    const datalist = document.getElementById("marcas");
    marcasRef.once("value", function(snapshot) {
        const marcas = new Set();
        snapshot.forEach(function(childSnapshot) {
            marcas.add(childSnapshot.val().marca);
        });

        marcas.forEach(function(marca) {
            const option = document.createElement("option");
            option.value = marca;
            datalist.appendChild(option);
        });
    });
}

carregarMarcas();

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}

let acaoAtual = "cadastrar"; // Valor padrão

document.getElementById("cadastrarFreezer").addEventListener("click", function() {
    acaoAtual = "cadastrar";
    document.getElementById("popupConfirm").style.display = "flex";
});

document.getElementById("alterarFreezer").addEventListener("click", function() {
    acaoAtual = "alterar";
    document.getElementById("popupConfirm").style.display = "flex";
});

document.getElementById("confirmYes").addEventListener("click", function() {
    document.getElementById("popupConfirm").style.display = "none";
    if (acaoAtual === "cadastrar") {
        cadastrarFreezer(); // Chama a função de cadastro
    } else if (acaoAtual === "alterar") {
        alterarFreezer(); // Chama a função de alteração
    }
});

function sincronizarFreezersHistorico() {
    const statusRef = firebase.database().ref("freezers_status");
    const historicoRef = firebase.database().ref("freezers_historico");

    // Passo 1: Obter todos os IDs de freezers_status
    statusRef.once("value", function(statusSnapshot) {
        const statusIds = [];
        statusSnapshot.forEach(function(childSnapshot) {
            const freezerData = childSnapshot.val();
            statusIds.push(freezerData.id); // Armazena o valor do campo id dentro do nó, ex.: META1, META2
        });

        // Passo 2: Obter todos os IDs de freezers_historico
        historicoRef.once("value", function(historicoSnapshot) {
            const historicoIds = [];
            historicoSnapshot.forEach(function(childSnapshot) {
                historicoIds.push(childSnapshot.key); // Armazena o ID como chave no histórico
            });

            // Passo 3: Identificar IDs faltantes e IDs extras
            const idsFaltantes = statusIds.filter(id => !historicoIds.includes(id));
            const idsExtras = historicoIds.filter(id => !statusIds.includes(id));

            // Passo 4: Adicionar IDs faltantes a freezers_historico com campos vazios
            idsFaltantes.forEach(function(id) {
                const now = new Date();
                
                // Formata a data no formato desejado (por exemplo, "AAAA-MM-DD")
                const dataCriacao = now.toISOString().split("T")[0]; // apenas data
                const horaCriacao = "23h59";  // Hora fixa como 23h59
            
                historicoRef.child(id).child("temperatura").child("0").set(0);        // Define chave '0' com valor 0 para temperatura
                historicoRef.child(id).child("data").child("0").set(dataCriacao);     // Define chave '0' com a data de criação real
                historicoRef.child(id).child("hora").child("0").set(horaCriacao);     // Define chave '0' com valor '23h59' para hora
            });

            // Passo 5: Remover IDs extras de freezers_historico
            idsExtras.forEach(function(id) {
                historicoRef.child(id).remove(); // Remove o ID que não existe mais em freezers_status
            });
        });
    });
}


function sincronizarFreezersStatus() {
    const freezersRef = firebase.database().ref("freezers");
    const statusRef = firebase.database().ref("freezers_status");

    // Passo 1: Obter todos os IDs de `freezers`
    freezersRef.once("value", function(freezersSnapshot) {
        const freezersIds = [];
        freezersSnapshot.forEach(function(childSnapshot) {
            freezersIds.push(childSnapshot.key); // Usa o ID da tabela `freezers` como referência
        });

        // Passo 2: Obter todos os IDs de `freezers_status`
        statusRef.once("value", function(statusSnapshot) {
            const statusIds = [];
            statusSnapshot.forEach(function(childSnapshot) {
                statusIds.push(childSnapshot.key); // Usa o ID da tabela `freezers_status` como referência
            });

            // Passo 3: Identificar IDs extras em `freezers_status`
            const idsExtras = statusIds.filter(id => !freezersIds.includes(id));

            // Passo 4: Remover IDs extras de `freezers_status`
            idsExtras.forEach(function(id) {
                statusRef.child(id).remove(); // Remove o ID que não existe mais em `freezers`
            });
        });
    });
}