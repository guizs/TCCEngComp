function exibirMensagem(msg, isSuccess = false) {
    const mensagemElemento = document.querySelector('.message p');
    if (mensagemElemento) {
        mensagemElemento.textContent = msg;
        mensagemElemento.style.color = isSuccess ? 'green' : 'red';

        // Remove a classe de tremor se ela já estiver aplicada
        mensagemElemento.classList.remove('tremor');

        // Força reflow para reiniciar a animação
        void mensagemElemento.offsetWidth;

        // Adiciona a classe tremor em caso de erro
        if (!isSuccess) {
            mensagemElemento.classList.add('tremor');
        } else {
            // Define um timeout para limpar a mensagem após 10 segundos apenas se for de sucesso
            setTimeout(() => {
                mensagemElemento.textContent = '';
            }, 10000);
        }
    }
}

function salvarUsuario() {
    const email = document.getElementById('email-cadastro').value;
    const nome = document.getElementById('nome-cadastro').value;
    const senha = document.getElementById('senha-cadastro').value;
    const cfsenha = document.getElementById('cfsenha-cadastro').value;

    console.log('Email:', email);
    console.log('Nome:', nome);
    console.log('Senha:', senha);
    console.log('Confirmação de Senha:', cfsenha);

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

    // Verifica se o email já está cadastrado no banco de dados
    usuariosRef.orderByChild('email').equalTo(email).once('value')
    .then(snapshot => {
        if (snapshot.exists()) {
            exibirMensagem('O e-mail já está cadastrado em nosso banco de dados.');
        } else {
            // Email não existe, prossegue com a criação do usuário
            firebase.auth().createUserWithEmailAndPassword(email, senha)
            .then(userCredential => {
                const user = userCredential.user;
                usuariosRef.child(user.uid).set({
                    nome: nome,
                    email: email
                }).then(() => {
                    exibirMensagem('Usuário cadastrado com sucesso!', true);
                    LimpacamposCadastro(); // Chama a função para limpar os campos após o cadastro
                }).catch((error) => {
                    exibirMensagem('Erro ao cadastrar usuário no banco de dados: ' + error.message);
                });
            })
            .catch(error => {
                if (error.message == "The email address is already in use by another account.") {
                    exibirMensagem('O e-mail já está cadastrado em nosso banco de dados.');
                } else if (error.message == "Password should be at least 6 characters") {
                    exibirMensagem('A senha necessita ter mais que 5 caracteres.');
                } else {
                    exibirMensagem('Erro ao criar usuário no Authentication: ' + error.message);
                }
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