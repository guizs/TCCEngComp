// Funções de inicialização e eventos
document.getElementById("cadastrarFreezer").addEventListener("click", cadastrarFreezer);
document.getElementById("alterarFreezer").addEventListener("click", alterarFreezer);
document.getElementById("confirmYes").addEventListener("click", function () {
    document.getElementById("popupConfirm").style.display = "none";
    executarAcaoAtual();
});
document.getElementById("confirmNo").addEventListener("click", function () {
    document.getElementById("popupConfirm").style.display = "none";
});
document.getElementById("procurar").addEventListener("click", procurarFreezer);
document.getElementById("limparFiltros").addEventListener("click", function() {
    limparCamposProcurar();
    atualizarTabela();
});

document.getElementById("ID").addEventListener("input", function() {
    preencherListaIds();
    const inputId = document.getElementById("ID").value.toUpperCase(); // Converter o valor para maiúsculas
    const messageElem = document.querySelector(".message-alterar p");

    limparMensagem(messageElem);

    if (!inputId) {
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
                limparMensagem(messageElem);
            }
        });
        if (!found) {
            exibirErro(messageElem, "ID não encontrado: Verifique o ID informado.");
        }
    });
});

// Funções principais
function cadastrarFreezer() {
    const marca = document.getElementById("marcaInput").value.toUpperCase();
    const tempMin = parseFloat(document.getElementById("tempMinInput").value);
    const tempMax = parseFloat(document.getElementById("tempMaxInput").value);
    const messageElem = document.querySelector(".message p");

    limparMensagem(messageElem);

    if (!validarCamposCadastro(marca, tempMin, tempMax, messageElem)) return;

    exibirPopupConfirmacao("cadastrar");
}

function alterarFreezer() {
    const inputId = document.getElementById("ID").value;
    const marca = document.getElementById("marca-alterar").value.toUpperCase();
    const tempMin = parseFloat(document.getElementById("tempMin-alterar").value);
    const tempMax = parseFloat(document.getElementById("tempMax-alterar").value);
    const messageElem = document.querySelector(".message-alterar p");

    limparMensagem(messageElem);

    if (!validarCamposAlteracao(inputId, marca, tempMin, tempMax, messageElem)) return;

    exibirPopupConfirmacao("alterar");
}

function executarAcaoAtual() {
    if (acaoAtual === "cadastrar") {
        executarCadastro();
    } else if (acaoAtual === "alterar") {
        executarAlteracao();
    }
}

function executarCadastro() {
    const marca = document.getElementById("marcaInput").value.toUpperCase();
    const tempMin = parseFloat(document.getElementById("tempMinInput").value);
    const tempMax = parseFloat(document.getElementById("tempMaxInput").value);
    const messageElem = document.querySelector(".message p");
    const ref = firebase.database().ref("freezers");
    const counterRef = firebase.database().ref("counter");

    counterRef.transaction(function (currentCounter) {
        return (currentCounter || 0) + 1;
    }, function (error, committed, snapshot) {
        if (error) {
            exibirErro(messageElem, "Erro ao atualizar o contador: Contate o suporte.");
        } else if (committed) {
            const newId = snapshot.val();
            const brandCode = marca.substring(0, 4).toUpperCase();
            const fullId = brandCode + newId;

            ref.child(newId).set({
                id: fullId,
                marca: marca,
                tempMin: tempMin,
                tempMax: tempMax,
                dataCadastro: new Date().toISOString(),
            }, function (error) {
                if (error) {
                    exibirErro(messageElem, "Erro ao cadastrar o freezer: Contate o suporte.");
                } else {
                    sincronizarFreezersStatus(newId, fullId, marca, tempMin, tempMax);
                    sincronizarFreezersHistorico(newId);
                    exibirSucesso(messageElem, "Freezer cadastrado com sucesso.");
                    limparCamposCadastro();
                    atualizarTabela();
                }
            });
        }
    });
}

function executarAlteracao() {
    const inputId = document.getElementById("ID").value;
    const marca = document.getElementById("marca-alterar").value.toUpperCase();
    const tempMin = parseFloat(document.getElementById("tempMin-alterar").value);
    const tempMax = parseFloat(document.getElementById("tempMax-alterar").value);
    const messageElem = document.querySelector(".message-alterar p");

    const ref = firebase.database().ref("freezers");
    ref.once("value", function (snapshot) {
        let found = false;
        snapshot.forEach(function (childSnapshot) {
            if (childSnapshot.val().id === inputId) {
                found = true;
                const fullId = childSnapshot.val().id;
                ref.child(childSnapshot.key).update({
                    id: fullId,
                    marca: marca,
                    tempMin: tempMin,
                    tempMax: tempMax,
                    dataAlteracao: new Date().toISOString(),
                }, function (error) {
                    if (error) {
                        exibirErro(messageElem, "Erro ao alterar o freezer: Contate o suporte.");
                    } else {
                        sincronizarFreezersStatus(childSnapshot.key, fullId, marca, tempMin, tempMax, true);
                        exibirSucesso(messageElem, "Freezer alterado com sucesso.");
                        limparCamposAlteracao();
                    }
                });
            }
        });
        if (!found) {
            exibirErro(messageElem, "ID não encontrado: Verifique o ID informado.");
        }
    });
}

function procurarFreezer() {
    const inputId = document.getElementById("ID-busca").value;
    const inputMarca = document.getElementById("marca-busca").value.toUpperCase();
    const tabelaBody = document.querySelector("#freezersTable tbody");
    tabelaBody.innerHTML = "";

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
    limparCamposProcurar();
}

// Funções auxiliares
function limparMensagem(messageElem) {
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");
}

function exibirErro(messageElem, mensagem) {
    messageElem.textContent = mensagem;
    messageElem.parentElement.classList.add("error");
    adicionarEfeitoTremor(messageElem);
}

function exibirSucesso(messageElem, mensagem) {
    messageElem.textContent = mensagem;
    messageElem.parentElement.classList.add("success");
    adicionarEfeitoTremor(messageElem);
}

function adicionarEfeitoTremor(messageElem) {
    setTimeout(() => {
        messageElem.parentElement.classList.add("tremor");
    }, 10);
    setTimeout(() => {
        messageElem.parentElement.classList.remove("tremor");
    }, 510);
}

function validarCamposCadastro(marca, tempMin, tempMax, messageElem) {
    if (!marca || isNaN(tempMin) || isNaN(tempMax)) {
        exibirErro(messageElem, "Por favor, preencha todos os campos.");
        return false;
    }
    if (tempMin > tempMax) {
        exibirErro(messageElem, "A temperatura mínima não pode ser maior que a temperatura máxima.");
        return false;
    }
    return true;
}

function validarCamposAlteracao(inputId, marca, tempMin, tempMax, messageElem) {
    if (!inputId || !marca || isNaN(tempMin) || isNaN(tempMax)) {
        exibirErro(messageElem, "Por favor, preencha todos os campos.");
        return false;
    }
    if (tempMin > tempMax) {
        exibirErro(messageElem, "A temperatura mínima não pode ser maior que a temperatura máxima.");
        return false;
    }
    return true;
}

function limparCamposCadastro() {
    document.getElementById("marcaInput").value = "";
    document.getElementById("tempMinInput").value = "";
    document.getElementById("tempMaxInput").value = "";
}

function limparCamposAlteracao() {
    document.getElementById("ID").value = "";
    document.getElementById("marca-alterar").value = "";
    document.getElementById("tempMin-alterar").value = "";
    document.getElementById("tempMax-alterar").value = "";
}

function limparCamposProcurar() {
    document.getElementById("ID-busca").value = "";
    document.getElementById("marca-busca").value = "";
}

function exibirPopupConfirmacao(acao) {
    acaoAtual = acao;
    document.getElementById("popupConfirm").style.display = "flex";
}

function atualizarTabela() {
    const tabelaBody = document.querySelector("#freezersTable tbody");
    tabelaBody.innerHTML = "";

    const ref = firebase.database().ref("freezers");
    ref.once("value", function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
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

function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function sincronizarFreezersStatus(newId, fullId, marca, tempMin, tempMax, isUpdate = false) {
    const statusRef = firebase.database().ref("freezers_status");
    if (isUpdate) {
        statusRef.child(newId).once("value", function (snapshot) {
            if (snapshot.exists()) {
                const temperaturaAtual = snapshot.val().temperaturaAtual;
                const status = snapshot.val().status;
                statusRef.child(newId).update({
                    id: fullId,
                    marca: marca,
                    tempMin: tempMin,
                    tempMax: tempMax,
                    temperaturaAtual: temperaturaAtual,
                    status: status,
                }, function (error) {
                    if (error) {
                        console.error("Erro ao sincronizar o status do freezer.");
                    } else {
                        console.log("Tabela freezers_status sincronizada com sucesso.");
                    }
                });
            }
        });
    } else {
        statusRef.child(newId).set({
            id: fullId,
            marca: marca,
            tempMin: tempMin,
            tempMax: tempMax,
            temperaturaAtual: "",
            status: "",
        }, function (error) {
            if (error) {
                console.error("Erro ao sincronizar o status do freezer.");
            } else {
                console.log("Tabela freezers_status sincronizada com sucesso.");
            }
        });
    }
}

function sincronizarFreezersHistorico(newId) {
    const historicoRef = firebase.database().ref("freezers_historico");
    historicoRef.child(newId).once("value", function (snapshot) {
        if (!snapshot.exists()) {
            const now = new Date();
            const dataCriacao = now.toISOString().split("T")[0];
            const horaCriacao = "23h59";

            historicoRef.child(newId).child("temperatura").child("0").set(0);
            historicoRef.child(newId).child("data").child("0").set(dataCriacao);
            historicoRef.child(newId).child("hora").child("0").set(horaCriacao);
        }
    });
}

document.getElementById("ID").addEventListener("focus", preencherListaIds);

// Função para preencher a lista de IDs no datalist
function preencherListaIds() {
    const datalist = document.getElementById("idList");
    datalist.innerHTML = ""; // Limpa os itens existentes para evitar duplicações // Limpa os itens existentes

    const ref = firebase.database().ref("freezers");
    ref.once("value", function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            const option = document.createElement("option");
            option.value = childSnapshot.val().id;
            datalist.appendChild(option);
        });
    });
}

window.addEventListener("load", function() {
    atualizarTabela();
});