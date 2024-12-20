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
    const inputId = document.getElementById("ID").value.toUpperCase();
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

// Cadastrar novo freezer
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
    const inputId = document.getElementById("ID").value.trim().toUpperCase(); // Converte o ID para maiúsculas
    const marca = document.getElementById("marca-alterar").value.toUpperCase(); // Converte a marca para maiúsculas
    const tempMin = parseFloat(document.getElementById("tempMin-alterar").value);
    const tempMax = parseFloat(document.getElementById("tempMax-alterar").value);
    const messageElem = document.querySelector(".message-alterar p");

    limparMensagem(messageElem); // Limpar mensagens anteriores

    if (!validarCamposAlteracao(inputId, marca, tempMin, tempMax, messageElem)) return;

    const ref = firebase.database().ref("freezers");
    const statusRef = firebase.database().ref("freezers_status"); // Referência à tabela freezers_status

    ref.once("value", function (snapshot) {
        let found = false;

        snapshot.forEach(function (childSnapshot) {
            const freezer = childSnapshot.val();
            const freezerId = freezer.id.toUpperCase(); // Certifica-se de usar o ID em maiúsculas

            if (freezerId === inputId) { // Comparação case-insensitive
                found = true;

                const fullId = freezer.id; // Mantém o ID original
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
                        // Sincronizar com freezers_status
                        statusRef.child(childSnapshot.key).update({
                            tempMin: tempMin,
                            tempMax: tempMax,
                        }, function (statusError) {
                            if (statusError) {
                                exibirErro(messageElem, "Erro ao atualizar os valores em freezers_status.");
                            } else {
                                sincronizarFreezersStatus(
                                    childSnapshot.key,
                                    fullId,
                                    marca,
                                    tempMin,
                                    tempMax,
                                    true
                                );
                                exibirSucesso(messageElem, "Freezer alterado com sucesso.");
                                limparCamposAlteracao();

                                // Atualiza a tabela após a alteração
                                atualizarTabela();
                            }
                        });
                    }
                });
            }
        });

        if (!found) {
            // Exibir erro se o ID não foi encontrado
            exibirErro(messageElem, "ID não encontrado: Verifique o ID informado.");
        }
    });
}



// Executa a ação confirmada (cadastrar ou alterar freezer)
function executarAcaoAtual() {
    if (acaoAtual === "cadastrar") {
        executarCadastro();
    } else if (acaoAtual === "alterar") {
        executarAlteracao();
    }
}

// Processa o cadastro de um novo freezer no banco de dados
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

            ref.child(fullId).set({
                id: fullId,
                marca: marca,
                tempMin: tempMin,
                tempMax: tempMax,
                dataCadastro: new Date().toISOString(),
            }, function (error) {
                if (error) {
                    exibirErro(messageElem, "Erro ao cadastrar o freezer: Contate o suporte.");
                } else {
                    sincronizarFreezersStatus(fullId, fullId, marca, tempMin, tempMax);
                    exibirSucesso(messageElem, "Freezer cadastrado com sucesso.");
                    limparCamposCadastro();
                    atualizarTabela();
                }
            });
        }
    });
}

// Processa a alteração de um freezer no banco de dados
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
    const inputId = document.getElementById("ID-busca").value.trim().toUpperCase(); // Converter para maiúsculas
    const inputMarca = document.getElementById("marca-busca").value.trim().toUpperCase(); // Converter para maiúsculas
    const tabelaBody = document.querySelector("#freezersTable tbody");
    const messageElem = document.querySelector(".message-alterar p"); // Elemento para mensagens
    limparMensagem(messageElem); // Limpar mensagens anteriores

    tabelaBody.innerHTML = ""; // Limpa os resultados anteriores

    const ref = firebase.database().ref("freezers");
    ref.once("value", function (snapshot) {
        let encontrouFreezer = false;

        snapshot.forEach(function (childSnapshot) {
            const freezer = childSnapshot.val();
            const freezerId = freezer.id.toUpperCase();
            const freezerMarca = freezer.marca.toUpperCase();

            // Verifica se o freezer atende aos critérios de busca
            if (
                (inputId && freezerId === inputId) || // Busca por ID
                (inputMarca && freezerMarca === inputMarca) // Busca por marca
            ) {
                encontrouFreezer = true;

                // Adicionar freezer à tabela
                const row = tabelaBody.insertRow();
                row.insertCell(0).textContent = freezer.id;
                row.insertCell(1).textContent = freezer.marca;
                row.insertCell(2).textContent = freezer.tempMin;
                row.insertCell(3).textContent = freezer.tempMax;
                row.insertCell(4).textContent = freezer.dataCadastro ? formatarData(freezer.dataCadastro) : "-";
                row.insertCell(5).textContent = freezer.dataAlteracao ? formatarData(freezer.dataAlteracao) : "-";

                // Preencher o campo de ID ou marca conforme o critério
                if (!inputId) {
                    document.getElementById("ID-busca").value = freezer.id; // Preenche o ID se a busca foi por marca
                }
                if (!inputMarca) {
                    document.getElementById("marca-busca").value = freezer.marca; // Preenche a marca se a busca foi por ID
                }
            }
        });

        if (!encontrouFreezer) {
            // Exibir mensagem de erro apenas se nenhum freezer foi encontrado
            exibirErro(messageElem, "Nenhum freezer encontrado com os critérios informados.");
        }
    });
}


// Limpar mensagem de erro/sucesso
function limparMensagem(messageElem) {
    messageElem.textContent = "";
    messageElem.parentElement.classList.remove("success", "error", "tremor");
}

// Exibir mensagem de erro
function exibirErro(messageElem, mensagem) {
    messageElem.textContent = mensagem;
    messageElem.parentElement.classList.add("error");
    adicionarEfeitoTremor(messageElem);
}

// Exibir mensagem de sucesso
function exibirSucesso(messageElem, mensagem) {
    messageElem.textContent = mensagem;
    messageElem.parentElement.classList.add("success");
    adicionarEfeitoTremor(messageElem);
}

// Adicionar efeito tremor à mensagem
function adicionarEfeitoTremor(messageElem) {
    setTimeout(() => {
        messageElem.parentElement.classList.add("tremor");
    }, 10);
    setTimeout(() => {
        messageElem.parentElement.classList.remove("tremor");
    }, 510);
}

// Validar campos para o cadastro do freezer
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

// Validar campos para alteração do freezer
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

// Limpar campos do formulário de cadastro
function limparCamposCadastro() {
    document.getElementById("marcaInput").value = "";
    document.getElementById("tempMinInput").value = "";
    document.getElementById("tempMaxInput").value = "";
}

// Limpar campos do formulário de alteração
function limparCamposAlteracao() {
    document.getElementById("ID").value = "";
    document.getElementById("marca-alterar").value = "";
    document.getElementById("tempMin-alterar").value = "";
    document.getElementById("tempMax-alterar").value = "";
}

// Limpar campos do formulário de busca
function limparCamposProcurar() {
    document.getElementById("ID-busca").value = "";
    document.getElementById("marca-busca").value = "";
}

// Exibir pop-up de confirmação antes de executar ações
function exibirPopupConfirmacao(acao) {
    acaoAtual = acao;
    document.getElementById("popupConfirm").style.display = "flex";
}

// Atualizar tabela de freezers exibida
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

// Formatar a data para exibição
function formatarData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

// Sincronizar tabela de status do freezer
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

// Preencher lista de IDs ao focar no campo de ID
document.getElementById("ID").addEventListener("focus", preencherListaIds);

// Preencher lista de IDs para busca
function preencherListaIds() {
    const datalist = document.getElementById("idList");
    datalist.innerHTML = "";

    const ref = firebase.database().ref("freezers");
    ref.once("value", function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            const option = document.createElement("option");
            option.value = childSnapshot.val().id;
            datalist.appendChild(option);
        });
    });
}

// Atualizar tabela ao carregar a página
window.addEventListener("load", function() {
    atualizarTabela();
});