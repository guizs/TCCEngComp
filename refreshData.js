async function gerarFreezersComHistoricoAjustado() {
    const db = firebase.database(); // Referência ao Realtime Database
    const marcas = [
        "METALFRIO", "CONSUL", "BRASTEMP", "ELECTROLUX", "ESMALTEC", "PHILCO", "MIDEA"
    ];

    try {
        // Obter o contador atual
        const counterRef = db.ref("counter");
        const counterSnapshot = await counterRef.once("value");
        let counter = counterSnapshot.val() || 0; // Se o counter não existir, começa de 0

        for (let i = 0; i < 25; i++) {
            counter++; // Incrementa o contador para gerar o próximo ID

            // Selecionar marca e criar o ID do freezer
            const marcaCompleta = marcas[Math.floor(Math.random() * marcas.length)];
            const marcaPrefixo = marcaCompleta.substring(0, 4); // Apenas os 4 primeiros caracteres
            const freezerId = `${marcaPrefixo}${counter}`; // Exemplo: META1, CONS2, etc.

            // Escolher tipo de freezer (congelados ou resfriados)
            const isCongelados = Math.random() < 0.5; // 50% de chance para cada tipo
            let tempMin, tempMax;

            if (isCongelados) {
                // Congelados
                tempMin = parseFloat((Math.random() * -7 - 18).toFixed(1)); // Entre -25°C e -18°C
                tempMax = parseFloat((Math.random() * -5 - 10).toFixed(1)); // Entre -10°C e -5°C
            } else {
                // Resfriados
                tempMin = parseFloat((Math.random() * 2 - 2).toFixed(1)); // Entre -2°C e 0°C
                tempMax = parseFloat((Math.random() * 2 + 3).toFixed(1)); // Entre 3°C e 5°C
            }

            const dataCadastro = new Date().toISOString().replace("T", " ").substring(0, 19);

            // Estruturas para o banco de dados
            const freezerData = {
                id: freezerId,
                marca: marcaCompleta,
                tempMin: tempMin,
                tempMax: tempMax,
                dataCadastro: dataCadastro,
                dataAlteracao: "" // Inicialmente vazio
            };

            const statusData = {
                id: freezerId,
                marca: marcaCompleta,
                tempMin: tempMin,
                tempMax: tempMax,
                temperaturaAtual: "",
                status: ""
            };

            const historicoData = {
                temperatura: {
                    key1: "0.0" // Valor inicial
                },
                data: {
                    key1: "1970-01-01" // Data inicial
                },
                hora: {
                    key1: "00:00" // Hora inicial
                }
            };

            // Inserir dados no Firebase
            await db.ref(`freezers/${freezerId}`).set(freezerData);
            console.log(`Freezer ${freezerId} adicionado a "freezers".`);

            await db.ref(`freezers_status/${freezerId}`).set(statusData);
            console.log(`Status do freezer ${freezerId} adicionado a "freezers_status".`);

            await db.ref(`freezers_historico/${freezerId}`).set(historicoData);
            console.log(`Histórico inicial do freezer ${freezerId} adicionado a "freezers_historico".`);
        }

        // Atualizar o contador no Firebase
        await counterRef.set(counter);
        console.log("Counter atualizado para:", counter);

    } catch (error) {
        console.error("Erro ao criar freezers:", error);
    }
}


async function alimentarFreezersHistoricoComDatas() {
    const db = firebase.database(); // Referência ao Realtime Database

    try {
        // Obter todos os freezers
        const freezersSnapshot = await db.ref("freezers").once("value");
        const freezers = freezersSnapshot.val();

        if (!freezers) {
            console.error("Nenhum freezer encontrado no banco de dados.");
            return;
        }

        // Contador para IDs principais (1, 2, 3...)
        let counter = 1;

        for (const freezerKey in freezers) {
            const freezer = freezers[freezerKey];
            const tempMin = freezer.tempMin;
            const tempMax = freezer.tempMax;

            // Gera o ID no padrão solicitado
            const marca = freezer.marca.substring(0, 4).toUpperCase(); // Primeiros 4 caracteres da marca
            const fullId = `${marca}${counter}`; // ID completo com a marca e o número

            // Estrutura para o histórico
            const historicoData = {
                temperatura: {},
                data: {},
                hora: {}
            };

            let ultimaTemperatura = 0;
            let statusColor = "green";

            // Gerar 15 registros fictícios
            for (let i = 0; i < 15; i++) {
                const data = new Date();
                data.setDate(data.getDate() - i); // Subtrai dias para criar datas distintas
                const dataFormatada = data.toISOString().split("T")[0]; // Formato YYYY-MM-DD

                const hora = `${Math.floor(Math.random() * 24).toString().padStart(2, "0")}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}:00`; // Hora aleatória

                // Temperatura aleatória
                let temperatura;
                if (Math.random() <= 0.8) {
                    // 80% das temperaturas dentro da faixa
                    temperatura = (Math.random() * (tempMax - tempMin) + tempMin).toFixed(1);
                } else {
                    // 20% das temperaturas fora da faixa
                    temperatura = (Math.random() < 0.5
                        ? tempMin - Math.random() * 5 // Abaixo do mínimo
                        : tempMax + Math.random() * 5 // Acima do máximo
                    ).toFixed(1);
                }

                // Armazenar os valores no histórico
                const key = `${i + 1}`;
                historicoData.temperatura[key] = temperatura;
                historicoData.data[key] = dataFormatada;
                historicoData.hora[key] = hora;

                // Atualizar última temperatura e status
                if (i === 14) {
                    ultimaTemperatura = parseFloat(temperatura);
                    statusColor =
                        ultimaTemperatura >= tempMin && ultimaTemperatura <= tempMax ? "green" : "red";
                }
            }

            // Atualizar histórico no Firebase
            await db.ref(`freezers_historico/${counter}`).set(historicoData);
            console.log(`Histórico do freezer ${fullId} atualizado.`);

            // Atualizar status do freezer
            const statusData = {
                id: fullId,
                marca: freezer.marca,
                tempMin: tempMin,
                tempMax: tempMax,
                temperaturaAtual: ultimaTemperatura.toFixed(1),
                status: statusColor
            };

            await db.ref(`freezers_status/${counter}`).set(statusData);
            console.log(`Status do freezer ${fullId} atualizado.`);

            // Incrementa o contador para o próximo freezer
            counter++;
        }
    } catch (error) {
        console.error("Erro ao alimentar históricos e status:", error);
    }
}


async function limparFreezersHistorico() {
    const db = firebase.database(); // Referência ao Realtime Database

    try {
        // Obter todos os freezers históricos
        const historicoSnapshot = await db.ref("freezers_historico").once("value");
        const historicos = historicoSnapshot.val();

        if (!historicos) {
            console.error("Nenhum histórico encontrado no banco de dados.");
            return;
        }

        for (const freezerId in historicos) {
            // Remover todo o histórico do freezer
            await db.ref(`freezers_historico/${freezerId}`).remove();

            console.log(`Histórico de ${freezerId} removido com sucesso.`);
        }

        console.log("Todos os históricos foram limpos com sucesso.");
    } catch (error) {
        console.error("Erro ao limpar históricos:", error);
    }
}

function atualizarHistoricoEStatus() {
    const db = firebase.database();

    // Referências às tabelas
    const freezersStatusRef = db.ref('freezers_status');
    const freezersHistoricoRef = db.ref('freezers_historico');

    freezersStatusRef.once('value')
        .then(snapshot => {
            if (!snapshot.exists()) {
                console.log("A tabela freezers_status está vazia ou não existe.");
                return;
            }

            const freezersStatus = snapshot.val();

            // Processar cada freezer
            Object.keys(freezersStatus).forEach(async (freezerID) => {

                if (freezerID === "A_FR29") {
                    console.log(`Freezer ${freezerID} foi ignorado.`);
                    return; 
                }

                const freezer = freezersStatus[freezerID];
                const { tempMin, tempMax, status } = freezer;

                // Se o status for "gray", não atualizar
                if (status === "gray") {
                    console.log(`Freezer ${freezerID} está desligado. Não será atualizado.`);
                    return; // Pula este freezer
                }

                // Gerar temperatura com base nas regras
                const temperaturaAtual = gerarTemperatura(tempMin, tempMax);

                // Verificar se está dentro ou fora do intervalo
                const novoStatus = temperaturaAtual >= tempMin && temperaturaAtual <= tempMax ? 'green' : 'red';

                // Gerar data e hora atuais
                const agora = new Date();
                const data = agora.toISOString().split('T')[0].split('-').reverse().join('/'); // DD/MM/YYYY
                const hora = agora.toTimeString().split(' ')[0]; // HH:MM:SS

                // Obter o próximo índice para data, hora e temp
                const historicoSnapshot = await freezersHistoricoRef.child(freezerID).once('value');
                const historico = historicoSnapshot.val() || { data: {}, hora: {}, temp: {} };

                const proximoIndice = Object.keys(historico.data || {}).length + 1;

                // Atualizar os subnós data, hora e temp
                const updates = {};
                updates[`freezers_historico/${freezerID}/data/${proximoIndice}`] = data;
                updates[`freezers_historico/${freezerID}/hora/${proximoIndice}`] = hora;
                updates[`freezers_historico/${freezerID}/temperatura/${proximoIndice}`] = temperaturaAtual;

                // Atualizar temperaturaAtual e status no freezers_status
                updates[`freezers_status/${freezerID}/temperaturaAtual`] = temperaturaAtual;
                updates[`freezers_status/${freezerID}/status`] = novoStatus;

                // Atualizar no banco de dados
                db.ref().update(updates)
                    .then(() => {
                        console.log(`Histórico e status de ${freezerID} atualizados com sucesso.`);
                    })
                    .catch(error => {
                        console.error(`Erro ao atualizar ${freezerID}:`, error);
                    });
            });
        })
        .catch(error => {
            console.error("Erro ao acessar freezers_status:", error);
        });
}

// Função para gerar a temperatura
function gerarTemperatura(tempMin, tempMax) {
    const dentroDoIntervalo = Math.random() <= 0.8; // 80% de chance de estar dentro do intervalo
    if (dentroDoIntervalo) {
        return parseFloat((Math.random() * (tempMax - tempMin) + tempMin).toFixed(1)); // Dentro do intervalo
    } else {
        // Fora do intervalo
        const foraPraBaixo = Math.random() < 0.5;
        return parseFloat((foraPraBaixo
            ? tempMin - Math.random() * 5 // Até 5 graus abaixo do mínimo
            : tempMax + Math.random() * 5 // Até 5 graus acima do máximo
        ).toFixed(1));
    }
}

//limparFreezersHistorico();
//alimentarFreezersHistoricoComDatas();
//gerarFreezersComHistoricoAjustado();