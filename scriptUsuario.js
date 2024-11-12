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
                    gerencia: 'Não'
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

// Limpar campos do formulário de cadastro
function LimpacamposCadastro() {
    document.getElementById('email-cadastro').value = '';
    document.getElementById('nome-cadastro').value = '';
    document.getElementById('senha-cadastro').value = '';
    document.getElementById('cfsenha-cadastro').value = '';
}

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
            const gerenciaCell = row.insertCell(4);
            
            nomeCell.textContent = usuario.nome; 
            emailCell.textContent = usuario.email; 

            const dataCriacao = new Date(usuario.createdAt);
            dataCriacaoCell.textContent = dataCriacao.toLocaleDateString('pt-BR');

            ativoCell.textContent = usuario.ativo ? 'Ativo' : 'Desativado'; 
            gerenciaCell.textContent = usuario.gerencia ? 'Sim' : 'Não';

            // Clique apenas na coluna Situação para mostrar o menu de ativar/desativar
            ativoCell.onclick = (event) => {
                event.stopPropagation();
                esconderGerencia();
                mostrarMenuPopup(event, childSnapshot.key, usuario.ativo);
            };

            // Clique apenas na coluna Gerência para mostrar o botão de gerência
            gerenciaCell.onclick = (event) => {
                event.stopPropagation();
                esconderSituacao();
                mostrarBotaoGerencia(event, usuario, childSnapshot.key);
            };

            row.addEventListener('click', (event) => {
                event.stopPropagation();
                esconderGerencia();
                esconderSituacao();
            });
        });
    });
}


// Exibir botão para gerência
function mostrarBotaoGerencia(event, usuario, userId) {
    const gerenciaButton = document.getElementById('gerenciaButton');
    gerenciaButton.textContent = usuario.gerencia ? 'Tirar Gerência' : 'Tornar Gerente';
    gerenciaButton.style.display = 'block';

    const x = event.pageX;
    const y = event.pageY;
    gerenciaButton.style.left = `${x}px`;
    gerenciaButton.style.top = `${y}px`;

    const fecharGerenciaButton = (event) => {
        if (event.target !== gerenciaButton) {
            gerenciaButton.style.display = 'none';
            window.removeEventListener('click', fecharGerenciaButton);
        }
    };

    window.addEventListener('click', fecharGerenciaButton);

    gerenciaButton.onclick = (e) => {
        e.stopPropagation();
        confirmarTornarOuTirarGerente(userId, usuario.gerencia);
        gerenciaButton.style.display = 'none';
        window.removeEventListener('click', fecharGerenciaButton);
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

// Evento global para esconder botões e popups ao clicar fora
window.onclick = function(event) {
    const gerenciaButton = document.getElementById('gerenciaButton');
    const popup = document.getElementById('popupMenu');

    if (event.target !== gerenciaButton && !popup.contains(event.target)) {
        gerenciaButton.style.display = 'none';
    }

    if (!popup.contains(event.target)) {
        popup.style.display = 'none';
    }
};

// Confirmação de ação para gerência do usuário
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

// Tornar usuário um gerente
function tornarGerente(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ gerencia: true })
        .then(() => {
            exibirMensagem('Usuário agora é um gerente!', true);
            carregarUsuarios();
        })
        .catch(error => {
            exibirMensagem('Erro ao tornar usuário gerente: ' + error.message);
        });
}

// Remover gerência de usuário
function tirarGerencia(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ gerencia: false })
        .then(() => {
            exibirMensagem('Usuário não é mais um gerente!', true);
            carregarUsuarios();
        })
        .catch(error => {
            exibirMensagem('Erro ao tirar gerência do usuário: ' + error.message);
        });
}

// Exibir menu popup de situação do usuário
function mostrarMenuPopup(event, userId, ativo) {
    event.preventDefault();
    const popup = document.getElementById('popupMenu');

    esconderGerencia();

    popup.style.display = 'block';

    const x = event.pageX;
    const y = event.pageY;

    const popupWidth = popup.offsetWidth;
    const popupHeight = popup.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

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

    btnDesativar.onclick = () => {
        if (confirm('Você realmente deseja desativar este usuário?')) {
            desativarUsuario(userId);
            popup.style.display = 'none';
        }
    };

    btnAtivar.onclick = () => {
        if (confirm('Você realmente deseja ativar este usuário?')) {
            ativarUsuario(userId);
            popup.style.display = 'none';
        }
    };

    window.onclick = (e) => {
        if (e.target !== popup && !popup.contains(e.target)) {
            popup.style.display = 'none';
        }
    };
}

// Desativar usuário no banco de dados
function desativarUsuario(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ ativo: false })
        .then(() => {
            exibirMensagem('Usuário desativado com sucesso!', true);
            carregarUsuarios();
        })
        .catch(error => {
            exibirMensagem('Erro ao desativar usuário: ' + error.message);
        });
}

// Ativar usuário no banco de dados
function ativarUsuario(userId) {
    const usuariosRef = firebase.database().ref('usuarios/' + userId);

    usuariosRef.update({ ativo: true })
        .then(() => {
            exibirMensagem('Usuário ativado com sucesso!', true);
            carregarUsuarios();
        })
        .catch(error => {
            exibirMensagem('Erro ao ativar usuário: ' + error.message);
        });
}

// Limpar filtros de busca de usuário
function limparFiltros() {
    document.getElementById('nome-pesquisa').value = '';
    document.getElementById('email-pesquisa').value = '';
    carregarUsuarios();
}

document.getElementById('limpar-filtros').onclick = limparFiltros;

// Buscar usuários com base em critérios de nome e e-mail
function buscarUsuarios() {
    const nomePesquisa = document.getElementById('nome-pesquisa').value.trim().toLowerCase();
    const emailPesquisa = document.getElementById('email-pesquisa').value.trim().toLowerCase();

    const usuariosRef = firebase.database().ref('usuarios');
    const tbody = document.querySelector('#freezersTable tbody');
    tbody.innerHTML = '';

    if (nomePesquisa || emailPesquisa) {
        usuariosRef.once('value', (snapshot) => {
            snapshot.forEach((childSnapshot) => {
                const usuario = childSnapshot.val();
                const nome = usuario.nome.toLowerCase();
                const email = usuario.email.toLowerCase();

                if ((nomePesquisa && nome.includes(nomePesquisa)) || (emailPesquisa && email.includes(emailPesquisa))) {
                    const row = tbody.insertRow();
                    
                    const nomeCell = row.insertCell(0);
                    const emailCell = row.insertCell(1);
                    const dataCriacaoCell = row.insertCell(2);
                    const ativoCell = row.insertCell(3);
                    const gerenciaCell = row.insertCell(4);
                    
                    nomeCell.textContent = usuario.nome; 
                    emailCell.textContent = usuario.email; 

                    const dataCriacao = new Date(usuario.createdAt);
                    dataCriacaoCell.textContent = dataCriacao.toLocaleDateString('pt-BR');

                    ativoCell.textContent = usuario.ativo ? 'Ativo' : 'Desativado'; 
                    gerenciaCell.textContent = usuario.gerencia ? 'Sim' : 'Não';

                    gerenciaCell.onclick = (event) => {
                        event.stopPropagation();
                        esconderSituacao();
                        mostrarBotaoGerencia(event, usuario, childSnapshot.key);
                    };

                    row.addEventListener('click', (event) => {
                        event.stopPropagation();
                        esconderGerencia();
                        mostrarMenuPopup(event, childSnapshot.key, usuario.ativo);
                    });
                }
            });
        });
    }
}

document.getElementById('buscar-pesquisa').addEventListener('click', buscarUsuarios);

window.onload = () => {
    carregarUsuarios();
};