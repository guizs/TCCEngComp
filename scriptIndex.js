function login(event) {
    event.preventDefault();

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    const loader = document.getElementById('loader'); // Pegando o elemento loader

    loader.style.visibility = "visible"; // Mostra o loader no início do login

    firebase.auth().signInWithEmailAndPassword(email, senha)
    .then(response => {
        const userId = response.user.uid;

        // Obtém o nome do usuário no banco de dados
        return firebase.database().ref('usuarios/' + userId).once('value');
    })
    .then(snapshot => {
        const usuario = snapshot.val();
        if (usuario && usuario.nome) {
            // Atualiza o status do login no banco de dados
            return atualizarStatusLogin(usuario.nome);
        } else {
            throw new Error("Usuário não encontrado no banco de dados.");
        }
    })
    .then(() => {
        // Mantém o loader visível e redireciona para a página inicial
        window.location.href = "inicial.html";
    })
    .catch(error => {
        console.log(error); // Verifica a estrutura do erro no console
        loader.style.visibility = "hidden"; // Oculta o loader em caso de erro
        alert(getErrorMessage(error));
    });
}

// Função para atualizar o status na tabela 'userlogado' ao fazer login
function atualizarStatusLogin(nomeUsuario) {
    return firebase.database().ref('userlogado').set({
        nome: nomeUsuario,
        bool: true
    });
}

function getErrorMessage(error) {
    // Verifica primeiro o `error.code`
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
            // Analisa a mensagem de erro para identificar "INVALID_LOGIN_CREDENTIALS"
            if (error.message && error.message.includes("INVALID_LOGIN_CREDENTIALS")) {
                return "E-mail ou senha incorretos. Verifique e tente novamente.";
            }
            return "Erro interno. Por favor, tente novamente mais tarde.";
        default:
            return "Erro ao fazer login. Por favor, tente novamente mais tarde.";
    }
}