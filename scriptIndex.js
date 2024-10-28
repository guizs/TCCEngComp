function login(event) {
    event.preventDefault(); // Impede o envio padrão do formulário

    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    const loader = document.getElementById("loader"); // Pega o elemento do loader

    firebase.auth().signInWithEmailAndPassword(email, senha)
    .then(response => {
        const userId = response.user.uid; // Obtém o UID do usuário

        // Verifica o status do usuário no banco de dados
        return firebase.database().ref('usuarios/' + userId).once('value');
    })
    .then(snapshot => {
        const usuario = snapshot.val();

        if (usuario && usuario.ativo) {
            // Usuário está ativo, prossegue com o login
            loader.style.visibility = "visible";

            setTimeout(() => {
                window.location.href = "inicial.html";
            }, 3000);
        } else {
            // Usuário está inativo, exibe mensagem de erro e faz logout
            alert('Sua conta está desativada. Entre em contato com o suporte.');
            firebase.auth().signOut(); // Desconecta o usuário imediatamente
        }
    })
    .catch(error => {
        alert(getErrorMessage(error));
    });
}

function RecuperarSenha(event) {
    event.preventDefault();
    const email = document.getElementById('email').value;
    const loader = document.getElementById("loader");

    loader.style.visibility = "visible";

    firebase.auth().sendPasswordResetEmail(email)
    .then(() => {
        loader.style.visibility = "hidden";
        alert('Email de recuperação enviado com sucesso.');
    })
    .catch(error => {
        loader.style.visibility = "hidden";
        if (error.code === 'auth/user-not-found') {
            alert('Não há nenhum usuário cadastrado com este email.');
            return;
        } else if (error.code === 'auth/too-many-requests') {
            alert('Muitas tentativas. Por favor, tente novamente mais tarde ou troque sua senha.');
            return;
        } else {
            alert(getErrorMessage(error));
        }
    });
}

function getErrorMessage(error) {
    if (error.code === "auth/invalid-credential") {
        return "E-mail ou senha inválidos.";
    }
    return error.message;
}
