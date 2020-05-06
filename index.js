//executando as variaveis de ambiente
require("dotenv/config");

/**
 * EXPRESS: framework que ajuda a comunicação de requisições e resposta do front e back
 *  
 */
const express = require('express');

/**
 * inicializa as funções do express
 * 
 **/
const app = express();

/**
 * o modulo path fornece uma maneira de trabalhar com diretorios em node js 
 */
const path = require('path');

/**
 * convertendo dados da url para json
 */
const bodyParser = require('body-parser');

/**
 * instanciando modulos para acesso a api google docs 
 */
const GoogleSpreadSheet = require('google-spreadsheet');

// gerar credenciais do google e anexar aqui
/* const credentials = require('./bugtrack.json');
 */
/**
 * instanciando modulos da api de sendgrid para enviar email e sms
 */

const sgMail = require('@sendgrid/mail');


// configurações de acessoa a api google docs

const docId = process.env.DOC_ID;
const worksheetIndex = 0;
const sendGridKey = process.env.SEND_GRID_KEY;

/**
 * trabalhando com promisify e async await
 */
const { promisify } = require('util');

/**
 * definindo o meio de comunicação entre back e front
 * com engine EJS: um modelo de escrever html com informações vinda do back-end
 */
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

/**
 * pega o corpo da requisição e deixa na forma que seja possivel entender no projeto
 * pega a url do post e transforma em json
 * 
 */
app.use(bodyParser.urlencoded({ extended: true }));


/**
 * rotas de comunicação
 * 
 * req: requisição feita pelo usuario atraves da url
 * resp: resposta feita pelo servidor node expressjs
 */
app.get('/', (req, resp) => {
    //resp.send("home");    

    //renderiza a pagina HOME.EJS
    resp.render('home');

});

/**
 * oculta as informações na url com o metodo post
 * 
 */
app.post('/', async (req, resp) => {

    try {
        //variaveis vindo do post
        const {
            name,
            email,
            issueType,
            howToReproduce,
            expectedOutput,
            receivedOutput,
            userAgent,
            userDate } = req.body;

        //setando a chave do documento que necessita acessar
        const doc = new GoogleSpreadSheet(docId);

        //verificando as credenciais de acesso
        await promisify(doc.useServiceAccountAuth)(credentials);
        //console.log("planilha aberta");

        //acessando a planilha ativa do google docs
        const infor = await promisify(doc.getInfo)();

        //pegando a primeira pagina da planilha 
        const worksheet = infor.worksheets[worksheetIndex];

        //adcionando linha teste na planilha 
        await promisify(worksheet.addRow)(
            {
                name: name,
                email: email,
                issueType: issueType,
                source: req.query.source || 'direct',
                howToReproduce: howToReproduce,
                expectedOutput: expectedOutput,
                receivedOutput: receivedOutput,
                userAgent: userAgent,
                userDate: userDate

            }, err => {
                resp.render('success');
            }
        );

        //se o erro issueType for critical ele manda a mensagem diretamente para o email 
        if (issueType === "CRITICAL") {
            sgMail.setApiKey(sendGridKey);
            const msg = {
                to: ' jllincolnsilva@gmail.com ',
                from: ' jllincolnsilva@gmail.com ',
                subject: ' Bug critico reportado ',
                text: `Bug critico reportado pelo usuario: ${name}`,
                html: ' <strong> e fácil de fazer em qualquer lugar, mesmo com o Node.js </strong> ',
            };
            await sgMail.enviar(msg);
        }




    } catch (err) {
        resp.send("Erro ao enviar formulário");
        console.log(err);
    }


});

//escuta a porta 3000 do browser
app.listen(3000, err => {
    if (err) {
        console.log("Erro no script", err);
    } else {
        console.log("BugTracker rodando na porta http://localhost:3000");
    }
});