// Função que conta a quantidade de IDs na tabela 'freezers_status'
async function contarFreezers() {
    const database = firebase.database().ref('freezers_status');
    let count = 0;
    
    await database.once('value', (snapshot) => {
        count = snapshot.numChildren();
    });
    
    return count;
}

// Função que inicializa a variável base e faz a divisão pela quantidade de freezers
async function calcularPontuacaoInicial() {
    const quantidadeFreezers = await contarFreezers();
    const pontuacaoInicial = 10;
    
    if (quantidadeFreezers === 0) {
        return { valorPorFreezer: 0, quantidadeFreezers };
    }

    const valorPorFreezer = pontuacaoInicial / quantidadeFreezers;
    return { valorPorFreezer, quantidadeFreezers };
}

// Função que calcula a pontuação final com base nos status dos freezers
async function calcularPontuacaoFinal() {
    const { valorPorFreezer, quantidadeFreezers } = await calcularPontuacaoInicial();
    
    if (quantidadeFreezers === 0) {
        return 0;
    }

    const database = firebase.database().ref('freezers_status');
    let pontuacaoFinal = 10;

    await database.once('value', (snapshot) => {
        snapshot.forEach((childSnapshot) => {
            const status = childSnapshot.val().status;

            // Ajusta a pontuação final com base no status do freezer
            if (status === 'gray' || status === 'red') {
                pontuacaoFinal -= valorPorFreezer * 0.4;
            } else if (status === 'yellow') {
                pontuacaoFinal -= valorPorFreezer * 0.2;
            }
        });
    });

    // Limita o valor da pontuação final a duas casas decimais
    pontuacaoFinal = pontuacaoFinal.toFixed(2);

    // Atualiza o conteúdo do elemento HTML com a pontuação final
    document.getElementById('pontuacaoElem').textContent = pontuacaoFinal;

    return pontuacaoFinal;
}

// Função que define a cor do elemento com base na pontuação final
function definirCorPontuacao(pontuacao) {
    const innerCircle = document.querySelector('.inner-circle');

    // Remove classes de cor anteriores
    innerCircle.classList.remove('vermelho-forte', 'vermelho-medio', 'vermelho-claro', 'amarelo-claro', 'amarelo-medio', 'verde-claro', 'verde');

    // Define cor com base na pontuação
    if (pontuacao < 1) {
        innerCircle.style.background = '#b71c1c'; // Vermelho forte
        innerCircle.style.color = '#fff';
    } else if (pontuacao >= 1 && pontuacao < 2) {
        innerCircle.style.background = '#d32f2f'; // Vermelho médio
        innerCircle.style.color = '#fff';
    } else if (pontuacao >= 2 && pontuacao < 2.5) {
        innerCircle.style.background = '#e57373'; // Vermelho claro
        innerCircle.style.color = '#fff';
    } else if (pontuacao >= 2.5 && pontuacao < 3) {
        innerCircle.style.background = '#ef9a9a'; // Vermelho mais claro
        innerCircle.style.color = '#000';
    } else if (pontuacao >= 3 && pontuacao < 4) {
        innerCircle.style.background = '#ffb74d'; // Amarelo claro
        innerCircle.style.color = '#000';
    } else if (pontuacao >= 4 && pontuacao < 5) {
        innerCircle.style.background = '#ffcc80'; // Amarelo mais claro
        innerCircle.style.color = '#000';
    } else if (pontuacao >= 5 && pontuacao < 6) {
        innerCircle.style.background = '#fff176'; // Amarelo claro
        innerCircle.style.color = '#000';
    } else if (pontuacao >= 6 && pontuacao < 7) {
        innerCircle.style.background = '#ffd54f'; // Amarelo mais forte
        innerCircle.style.color = '#000';
    } else if (pontuacao >= 7 && pontuacao < 8) {
        innerCircle.style.background = '#fdd835'; // Amarelo escuro
        innerCircle.style.color = '#000';
    } else if (pontuacao >= 8 && pontuacao < 9) {
        innerCircle.style.background = '#aed581'; // Verde claro
        innerCircle.style.color = '#000';
    } else if (pontuacao >= 9 && pontuacao <= 10) {
        innerCircle.style.background = '#81c784'; // Verde mais escuro
        innerCircle.style.color = '#000';
    }
}

// Atualiza a pontuação e altera a cor da inner-circle
async function atualizarPontuacao() {
    const pontuacao = await calcularPontuacaoFinal();
    document.getElementById('pontuacaoElem').textContent = pontuacao; // Atualiza o valor no HTML
    definirCorPontuacao(pontuacao); // Aplica a cor baseada na pontuação
}

// Chama a função para atualizar a pontuação e a cor
atualizarPontuacao();

// Exemplo de chamada da função
calcularPontuacaoFinal();