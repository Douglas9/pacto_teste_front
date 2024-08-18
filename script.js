function processarArquivo(evento) {
    const arquivo = evento.target.files[0];
    const leitor = new FileReader();

    leitor.onload = function(e) {
        let dados;
        if (arquivo.name.endsWith('.xlsx')) {
            dados = new Uint8Array(e.target.result);
            const planilha = XLSX.read(dados, { type: 'array' });
            const primeiraAba = planilha.Sheets[planilha.SheetNames[0]];
            const dadosJson = XLSX.utils.sheet_to_json(primeiraAba, { header: 1 });
            exibirTabela(dadosJson, 'xlsx');
        } else if (arquivo.name.endsWith('.csv')) {
            const csv = e.target.result;
            const dadosJson = CSVParaArray(csv);
            exibirTabela(dadosJson, 'csv');
        }
    };

    if (arquivo.name.endsWith('.xlsx')) {
        leitor.readAsArrayBuffer(arquivo);
    } else if (arquivo.name.endsWith('.csv')) {
        leitor.readAsText(arquivo);
    }
}

function exibirTabela(dados, extensao) {
    const tabela = document.getElementById('tabelaDados').getElementsByTagName('tbody')[0];
    tabela.innerHTML = '';

    dados.forEach((linha, indiceLinha) => {
        if ((extensao === 'xlsx' && indiceLinha === 0) || (extensao === 'csv' && indiceLinha === 0)) {
            return;
        }

        const tr = document.createElement('tr');
        const numColunas = 20; 

        for (let i = 0; i < numColunas; i++) {
            const td = document.createElement('td');
            const entrada = document.createElement('input');

            const valorCelula = linha[i] !== undefined ? linha[i] : '';

            if ([3, 4, 18, 19, 20].includes(i)) {
                try {
                    let dataConvertida;
                    if (typeof valorCelula === 'number') {
                        dataConvertida = XLSX.SSF.format("dd/mm/yyyy", valorCelula);
                    } else if (typeof valorCelula === 'string') {
                        const data = new Date(valorCelula);
                        if (!isNaN(data.getTime())) {
                            dataConvertida = data.toLocaleDateString('pt-BR');
                        } else {
                            dataConvertida = valorCelula; 
                        }
                    } else {
                        dataConvertida = valorCelula;
                    }
                    entrada.value = dataConvertida;
                } catch (erro) {
                    console.error(`Erro ao formatar a célula ${i} na linha ${indiceLinha}: ${erro}`);
                    entrada.value = valorCelula;
                }
            } else {
                entrada.value = valorCelula;
            }

            entrada.dataset.row = indiceLinha;
            entrada.dataset.cell = i;
            td.appendChild(entrada);
            tr.appendChild(td);
        }

        tabela.appendChild(tr);
    });
}

function isData(valor) {
    return (typeof valor === 'number' && XLSX.SSF.is_date_code(valor));
}

function salvarDados() {
    const tabela = document.getElementById('tabelaDados').getElementsByTagName('tbody')[0];
    const dadosDTO = [];

    for (let i = 0, linha; linha = tabela.rows[i]; i++) {
        const celulas = linha.cells;
        if (celulas.length < 20) {
            console.warn(`Linha ${i} tem menos de 20 células`);
            continue; 
        }
        
        const dados = new DadosDTO(
            celulas[1].querySelector('input')?.value || '', // Nome completo
            celulas[0].querySelector('input')?.value || '', // Matrícula
            celulas[2].querySelector('input')?.value || '', // CPF
            celulas[3].querySelector('input')?.value || '', // Data de Cadastro
            celulas[4].querySelector('input')?.value || '', // Data de Nascimento
            celulas[5].querySelector('input')?.value || '', // Telefone Residencial
            celulas[6].querySelector('input')?.value || '', // Telefone Celular
            celulas[7].querySelector('input')?.value || '', // Email
            celulas[8].querySelector('input')?.value || '', // Logradouro
            celulas[9].querySelector('input')?.value || '', // Número
            celulas[10].querySelector('input')?.value || '', // Complemento
            celulas[11].querySelector('input')?.value || '', // Bairro
            celulas[12].querySelector('input')?.value || '', // Cep
            celulas[13].querySelector('input')?.value || '', // Cidade
            celulas[14].querySelector('input')?.value || '', // Estado
            celulas[15].querySelector('input')?.value || '', // País
            celulas[16].querySelector('input')?.value || '', // Plano Descrição
            celulas[17].querySelector('input')?.value || '', // Data de lançamento
            celulas[18].querySelector('input')?.value || '', // Data de início
            celulas[19].querySelector('input')?.value || ''  // Data de fim
        );
        dadosDTO.push(dados);
    }

    console.log(JSON.stringify(dadosDTO));
    enviarDados(JSON.stringify(dadosDTO));
}

function CSVParaArray(csvString, delimitador = ",") {
    const linhas = csvString.trim().split("\n");
    return linhas.map(linha => linha.split(delimitador));
}

function DadosDTO(
    matricula, nomeCompleto, cpf, dataCadastro, dataNascimento,
    telefoneResidencial, telefoneCelular, email, logradouro, numero,
    complemento, bairro, cep, cidade, estado, pais, planoDescricao,
    dataLancamento, dataInicio, dataFim
) {
    this.matricula = matricula;
    this.nomeCompleto = nomeCompleto;
    this.cpf = cpf;
    this.dataCadastro = dataCadastro;
    this.dataNascimento = dataNascimento;
    this.telefoneResidencial = telefoneResidencial;
    this.telefoneCelular = telefoneCelular;
    this.email = email;
    this.logradouro = logradouro;
    this.numero = numero;
    this.complemento = complemento;
    this.bairro = bairro;
    this.cep = cep;
    this.cidade = cidade;
    this.estado = estado;
    this.pais = pais;
    this.planoDescricao = planoDescricao;
    this.dataLancamento = dataLancamento;
    this.dataInicio = dataInicio;
    this.dataFim = dataFim;
}

function enviarDados(data){

    const progressoContainer = document.getElementById('progressoContainer');
    const barraProgresso = document.getElementById('barraProgresso');
    
    progressoContainer.style.display = 'block';
    barraProgresso.style.width = '0%';
    barraProgresso.setAttribute('aria-valuenow', '0');

    var xhr = new XMLHttpRequest();
        xhr.upload.onprogress = function(evento) {
            if (evento.lengthComputable) {
                const porcentagem = (evento.loaded / evento.total) * 100;
                barraProgresso.style.width = `${porcentagem}%`;
                barraProgresso.setAttribute('aria-valuenow', porcentagem.toFixed(2));
            }
        };

    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            console.log(xhr.responseText);
            alert(xhr.responseText)
            cancelar()
        } else {
            console.error('Erro ao fazer a requisição: ' + xhr.status);
        }
    };
    xhr.open('POST', 'http://localhost:8080/importador', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(data);
}

function cancelar() {
    location.reload();
}
