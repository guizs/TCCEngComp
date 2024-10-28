// Exibir mensagem na tela
function exibirMensagem(msg, isSuccess = false) {
    const mensagemElemento = document.querySelector('.message p');
    if (mensagemElemento) {
        mensagemElemento.textContent = msg;
        mensagemElemento.style.color = isSuccess ? 'green' : 'red';

        mensagemElemento.classList.remove('tremor');
        void mensagemElemento.offsetWidth;

        if (!isSuccess) {
            mensagemElemento.classList.add('tremor');
        } else {
            setTimeout(() => {
                mensagemElemento.textContent = '';
            }, 10000);
        }
    }
}

// Salvar novo usuário
function salvarUsuario() {
    const email = document.getElementById('email-cadastro').value;
    const nome = document.getElementById('nome-cadastro').value;
    const senha = document.getElementById('senha-cadastro').value;
    const cfsenha = document.getElementById('cfsenha-cadastro').value;

    if (!nome || !email || !senha || !cfsenha) {
        exibirMensagem('Por favor, preencha todos os campos.');
        return;
    }

    if (senha !== cfsenha) {
        exibirMensagem('As senhas não conferem.');
        return;
    }

    const db = firebase.database();
    const usuariosRef = db.ref('usuarios');

    usuariosRef.orderByChild('email').equalTo(email).once('value')
    .then(snapshot => {
        if (snapshot.exists()) {
            exibirMensagem('O e-mail já está cadastrado!');
        } else {
            firebase.auth().createUserWithEmailAndPassword(email, senha)
            .then(userCredential => {
                const user = userCredential.user;
                return usuariosRef.child(user.uid).set({
                    uid: user.uid,
                    nome: nome,
                    email: email,
                    createdAt: firebase.database.ServerValue.TIMESTAMP,
                    ativo: true,
                    gerencia: 'Não'  // Adicionando a nova coluna Gerência
                });
            })
            .then(() => {
                exibirMensagem('Usuário cadastrado com sucesso!', true);
                carregarUsuarios();
                LimpacamposCadastro();
            })
            .catch(error => {
                exibirMensagem('Erro ao cadastrar usuário: ' + error.message);
            });
        }
    }).catch(error => {
        exibirMensagem('Erro ao verificar o email: ' + error.message);
    });
}

function LimpacamposCadastro() {
    document.getElementById('email-cadastro').value = '';
    document.getElementById('nome-cadastro').value = '';
    document.getElementById('senha-cadastro').value = '';
    document.getElementById('cfsenha-cadastro').value = '';
}

// Carregar usuários do banco de dados
function carregarUsuarios() {
    const usuariosRef = firebase.database().ref('usuarios');
    const tbody = document.querySelector('#freezersTable tbody');
    tbody.innerHTML = '';

    usuariosRef.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const usuario = childSnapshot.val();
            const row = tbody.insertRow();
            
            const nomeCell = row.insertCell(0);
            const emailCell = row.insertCell(1);
            const dataCriacaoCell = row.insertCell(2);
            const ativoCell = row.insertCell(3);
            const gerenciaCell = row.insertCell(4); // Célula para "Gerência"
            
            nomeCell.textContent = usuario.nome; 
            emailCell.textContent = usuario.email; 

            const dataCriacao = new Date(usuario.createdAt);
            dataCriacaoCell.textContent = dataCriacao.toLocaleDateString('pt-BR');

            ativoCell.textContent = usuario.ativo ? 'Ativo' : 'Desativado'; 
            gerenciaCell.textContent = usuario.gerencia ? 'Sim' : 'Não'; // Exibe 'Sim' ou 'Não'

            // Adiciona evento de clique na célula de gerência
            gerenciaCell.onclick = (event) => {
                event.stopPropagation(); // Impede a propagação do clique para o row
                esconderSituacao(); // Esconde o popup de situação
                mostrarBotaoGerencia(event, usuario, childSnapshot.key);
            };

            row.addEventListener('click', (event) => {
                event.stopPropagation();
                esconderGerencia(); // Esconde o botão de gerência
                mostrarMenuPopup(event, childSnapshot.key, usuario.ativo);
            });
        });
    });
}

// Modifique a função mostrarBotaoGerencia para incluir um evento global
function mostrarBotaoGerencia(event, usuario, userId) {
    const gerenciaButton = document.getElementById('gerenciaButton');
    gerenciaButton.textContent = usuario.gerencia ? 'Tirar Gerência' : 'Tornar Gerente';
    gerenciaButton.style.display = 'block';

    // Define a posição do botão
    const x = event.pageX;
    const y = event.pageY;
    gerenciaButton.style.left = `${x}px`;
    gerenciaButton.style.top = `${y}px`;

    // Adiciona um evento para fechar o botão quando clicar fora
    const fecharGerenciaButton = (event) => {
        if (event.target !== gerenciaButton) {
            gerenciaButton.style.display = 'none';
            window.removeEventListener('click', fecharGerenciaButton);
        }
    };

    window.addEventListener('click', fecharGerenciaButton);

    gerenciaButton.onclick = (e) => {
        e.stopPropagation(); // Impede a propagação do clique
        confirmarTornarOuTirarGerente(userId, usuario.gerencia);
        gerenciaButton.style.display = 'none'; // Oculta o botão após o clique
        window.removeEventListener('click', fecharGerenciaButton); // Remove o evento
    };
}

// Função para esconder o botão de gerência
function esconderGerencia() {
    const gerenciaButton = document.getElementById('gerenciaButton');
    gerenciaButton.style.display = 'none';
}

// Função para esconder o popup de situação
function esconderSituacao() {
    const popup = document.getElementById('popupMenu');
    popup.style.display = 'none';
}

// Alterar a função window.onclick para evitar conflito
window.onclick = function(event) {
    const gerenciaButton = document.getElementById('gerenciaButton');
    const popup = document.getElementById('popupMenu');

    // Esconder o botão de gerência se clicado fora
    if (event.target !== gerenciaButton && !popup.contains(event.target)) {
        gerenciaButton.style.display = 'none';
    }

    // Esconder o pop-up se clicado fora
    if (!popup.contains(event.target)) {
        popup.style.display = 'none';
    }
};

// Função para confirmar a ação de tornar ou tirar gerência
function confirmarTornarOuTirarGerente(userId, isGerente) {
    const action = isGerente ? "tirar" : "tornar";
    if (confirm(`Você realmente deseja ${action} este usuário como gerente?`)) {
        if (isGerente) {
            tirarGerencia(userId);
        } else {
            tornarGerente(userId);
        }
    }
}

// Função para tornar o usuário gerente
function tornarGerente(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ gerencia: true })  // Atualiza a coluna gerencia para true no banco de dados
        .then(() => {
            exibirMensagem('Usuário agora é um gerente!', true);
            carregarUsuarios(); // Atualiza a tabela
        })
        .catch(error => {
            exibirMensagem('Erro ao tornar usuário gerente: ' + error.message);
        });
}

// Função para tirar a gerência do usuário
function tirarGerencia(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ gerencia: false })  // Atualiza a coluna gerencia para false no banco de dados
        .then(() => {
            exibirMensagem('Usuário não é mais um gerente!', true);
            carregarUsuarios(); // Atualiza a tabela
        })
        .catch(error => {
            exibirMensagem('Erro ao tirar gerência do usuário: ' + error.message);
        });
}

function mostrarMenuPopup(event, userId, ativo) {
    event.preventDefault(); // Impede o comportamento padrão do evento, se necessário
    const popup = document.getElementById('popupMenu');

    // Fechar o botão de gerência se estiver visível
    esconderGerencia();

    // Exibir o pop-up
    popup.style.display = 'block';

    // Define a posição do pop-up com base na posição do clique
    const x = event.pageX;
    const y = event.pageY;

    // Ajusta a posição do pop-up para não sair da tela
    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // Verifica se o pop-up está saindo da tela à direita ou abaixo
    popup.style.left = (x + popupWidth > windowWidth) ? `${windowWidth - popupWidth}px` : `${x}px`;
    popup.style.top = (y + popupHeight > windowHeight) ? `${windowHeight - popupHeight}px` : `${y}px`;

    const btnDesativar = document.getElementById('btnDesativar');
    const btnAtivar = document.getElementById('btnAtivar');

    if (ativo) {
        btnDesativar.style.display = 'block';
        btnAtivar.style.display = 'none';
    } else {
        btnDesativar.style.display = 'none';
        btnAtivar.style.display = 'block';
    }

    // Ação ao clicar no botão desativar
    btnDesativar.onclick = () => {
        if (confirm('Você realmente deseja desativar este usuário?')) {
            desativarUsuario(userId);
            popup.style.display = 'none'; // Fecha o pop-up
        }
    };

    // Ação ao clicar no botão ativar
    btnAtivar.onclick = () => {
        if (confirm('Você realmente deseja ativar este usuário?')) {
            ativarUsuario(userId);
            popup.style.display = 'none'; // Fecha o pop-up
        }
    };

    // Fecha o pop-up ao clicar fora dele
    window.onclick = (e) => {
        if (e.target !== popup && !popup.contains(e.target)) {
            popup.style.display = 'none';
        }
    };
}

// Função para desativar usuário
function desativarUsuario(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ ativo: false })
        .then(() => {
            exibirMensagem('Usuário desativado com sucesso!', true);
            carregarUsuarios(); // Atualiza a tabela
        })
        .catch(error => {
            exibirMensagem('Erro ao desativar usuário: ' + error.message);
        });
}

// Função para ativar usuário
function ativarUsuario(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ ativo: true })
        .then(() => {
            exibirMensagem('Usuário ativado com sucesso!', true);
            carregarUsuarios(); // Atualiza a tabela
        })
        .catch(error => {
            exibirMensagem('Erro ao ativar usuário: ' + error.message);
        });
}

function limparFiltros() {
    document.getElementById('nome-pesquisa').value = '';
    document.getElementById('email-pesquisa').value = '';
    carregarUsuarios(); // Chama a função que carrega todos os usuários
}

// Adiciona o evento de clique ao botão de limpar filtros
document.getElementById('limpar-filtros').onclick = limparFiltros;

function buscarUsuarios() {
    const nomePesquisa = document.getElementById('nome-pesquisa').value.trim().toLowerCase();
    const emailPesquisa = document.getElementById('email-pesquisa').value.trim().toLowerCase();

    const usuariosRef = firebase.database().ref('usuarios');
    const tbody = document.querySelector('#freezersTable tbody');
    tbody.innerHTML = ''; // Limpa a tabela antes de exibir os resultados

    // Realiza a busca se um dos campos não estiver vazio
    if (nomePesquisa || emailPesquisa) {
        usuariosRef.once('value', (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const usuario = childSnapshot.val();
                const nome = usuario.nome.toLowerCase();
                const email = usuario.email.toLowerCase();

                // Verifica se o nome ou e-mail contém o texto pesquisado
                if ((nomePesquisa && nome.includes(nomePesquisa)) || (emailPesquisa && email.includes(emailPesquisa))) {
                    const row = tbody.insertRow();
                    
                    const nomeCell = row.insertCell(0);
                    const emailCell = row.insertCell(1);
                    const dataCriacaoCell = row.insertCell(2);
                    const ativoCell = row.insertCell(3);
                    const gerenciaCell = row.insertCell(4); // Célula para "Gerência"
                    
                    nomeCell.textContent = usuario.nome; 
                    emailCell.textContent = usuario.email; 

                    const dataCriacao = new Date(usuario.createdAt);
                    dataCriacaoCell.textContent = dataCriacao.toLocaleDateString('pt-BR');

                    ativoCell.textContent = usuario.ativo ? 'Ativo' : 'Desativado'; 
                    gerenciaCell.textContent = usuario.gerencia ? 'Sim' : 'Não'; // Exibe 'Sim' ou 'Não'

                    // Adiciona eventos de clique conforme necessário
                    gerenciaCell.onclick = (event) => {
                        event.stopPropagation(); // Impede a propagação do clique para o row
                        esconderSituacao(); // Esconde o popup de situação
                        mostrarBotaoGerencia(event, usuario, childSnapshot.key);
                    };

                    row.addEventListener('click', (event) => {
                        event.stopPropagation();
                        esconderGerencia(); // Esconde o botão de gerência
                        mostrarMenuPopup(event, childSnapshot.key, usuario.ativo);
                    });
                }
            });
        });
    }
    
}

// Adiciona o evento de clique no botão de busca
document.getElementById('buscar-pesquisa').addEventListener('click', buscarUsuarios);

// Inicializa a tabela ao carregar
window.onload = () => {
    carregarUsuarios();
};