function armazenarUsuarioNoLocalStorage() {
    const user = firebase.auth().currentUser;
    if (user) {
        const uid = user.uid;
        const db = firebase.database();
        const usuariosRef = db.ref('usuarios/' + uid);
        usuariosRef.once('value').then((snapshot) => {
            const nome = snapshot.val().nome;
            if (nome) {
                localStorage.setItem('nomeUsuario', nome); // Armazena o nome no local storage
                exibirNomeUsuario(); // Exibe o nome do usuário na interface
            }
        }).catch((error) => {
            console.error('Erro ao recuperar o nome do usuário:', error);
        });
    } else {
        console.error('Nenhum usuário logado.');
    }
}

function exibirNomeUsuario() {
    const nomeUsuario = localStorage.getItem('nomeUsuario');
    if (nomeUsuario) {
        document.getElementById('usernameSpan').textContent = `Olá, ${nomeUsuario}`;
    } else {
        document.getElementById('usernameSpan').textContent = 'Olá, '; // Reseta o conteúdo quando não há usuário logado
    }
}

// Chama a função para armazenar o nome do usuário durante o login
firebase.auth().onAuthStateChanged((user) => {
    if (user) {
        armazenarUsuarioNoLocalStorage();
    } else {
        localStorage.removeItem('nomeUsuario'); // Remove o nome do usuário do local storage quando deslogado
        exibirNomeUsuario(); // Reseta a exibição do nome
    }
});