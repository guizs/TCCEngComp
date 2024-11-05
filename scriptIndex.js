// Realiza a autenticação do usuário com e-mail e senha e redireciona para a página inicial em caso de sucesso
function login(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const loader = document.getElementById('loader');

    loader.style.visibility = "visible";

    firebase.auth().signInWithEmailAndPassword(email, senha)
    .then(response => {
        const userId = response.user.uid;
        return firebase.database().ref('usuarios/' + userId).once('value');
    })
    .then(snapshot => {
        const usuario = snapshot.val();
        if (usuario && usuario.nome) {
            return atualizarStatusLogin(usuario.nome);
        } else {
            throw new Error("Usuário não encontrado no banco de dados.");
        }
    })
    .then(() => {
        window.location.href = "inicial.html";
    })
    .catch(error => {
        console.log(error);
        loader.style.visibility = "hidden";
        alert(getErrorMessage(error));
    });
}

// Atualiza o status do usuário para logado no banco de dados
function atualizarStatusLogin(nomeUsuario) {
    return firebase.database().ref('userlogado').set({
        nome: nomeUsuario,
        bool: true
    });
}

// Retorna a mensagem de erro apropriada para exibir ao usuário em caso de falha no login
function getErrorMessage(error) {
    switch (error.code) {
        case "auth/user-not-found":
            return "E-mail não cadastrado. Verifique e tente novamente.";
        case "auth/wrong-password":
            return "Senha incorreta. Por favor, verifique e tente novamente.";
        case "auth/invalid-email":
            return "Formato de e-mail inválido. Por favor, insira um e-mail válido.";
        case "auth/too-many-requests":
            return "Muitas tentativas de login. Aguarde um pouco e tente novamente.";
        case "auth/internal-error":
            if (error.message && error.message.includes("INVALID_LOGIN_CREDENTIALS")) {
                return "E-mail ou senha incorretos. Verifique e tente novamente.";
            }
            return "Erro interno. Por favor, tente novamente mais tarde.";
        default:
            return "Erro ao fazer login. Por favor, tente novamente mais tarde.";
    }
}

// Envia um e-mail de redefinição de senha para o endereço fornecido pelo usuário
function RecuperarSenha(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();

    if (email) {
        firebase.auth().sendPasswordResetEmail(email)
        .then(() => {
            alert("Um e-mail de redefinição de senha foi enviado para o endereço informado. Verifique sua caixa de entrada.");
        })
        .catch(error => {
            console.log(error);
            alert(getForgotPasswordErrorMessage(error));
        });
    } else {
        alert("Por favor, insira o e-mail para enviar a redefinição de senha.");
    }
}

// Retorna a mensagem de erro apropriada em caso de falha no envio do e-mail de redefinição de senha
function getForgotPasswordErrorMessage(error) {
    switch (error.code) {
        case "auth/user-not-found":
            return "E-mail não cadastrado. Verifique e tente novamente.";
        case "auth/invalid-email":
            return "Formato de e-mail inválido. Por favor, insira um e-mail válido.";
        default:
            return "Erro ao enviar e-mail de redefinição de senha. Por favor, tente novamente mais tarde.";
    }
}