const mysql = require('mysql');
const express = require('express');
var app = express();
var bcrypt = require('bcryptjs');
const nodemailer = require("nodemailer");
const bodyParser = require('body-parser');
const cors = require('cors');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cors());

var mysqlConnection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'medsys',
    multipleStatements: true
});

mysqlConnection.connect((err) => {
    !err ? console.log('DB connection succeded.') : console.log('DB connection failed \n Error : ' + JSON.stringify(err, undefined, 2));
});

app.listen(3000, () => console.log('Server is runnig at port 3000'));

app.post('/medsys_searchusers', function(req, res){
	let condition;
    req.body.id ? condition = `AND idusuario = ${req.body.id}` : condition = '';
    req.body.email ? condition = `AND email = '${req.body.email}'` : condition = '';
    let querySql = `SELECT * FROM medsys_usuario WHERE 1=1 ${condition}`;
    mysqlConnection.query(querySql, (err, rows, fields) => {
        !err ? res.send(rows[0]) : console.log(err);
    })
});

app.post('/medsys_checkuser', function(req, res){
    let querySql = `SELECT * FROM medsys_usuario WHERE email = '${req.body.email}'`;
    mysqlConnection.query(querySql, (err, rows, fields) => {
        if (!err){
            const checkpassw = bcrypt.compareSync(req.body.passw, rows[0].senha);
            checkpassw ? res.send(rows) : res.send(false); 
        }else console.log(err);
    })
});

app.post('/medsys_insertuser', function(req, res){
    const password = req.body.password;
    const passwCrypt = encryptPassword(password);
    let querySql = `INSERT INTO medsys_usuario (nome_completo, email, senha) VALUES  ('${req.body.name}', '${req.body.email}', '${passwCrypt}')`;
    mysqlConnection.query(querySql, (err, rows, fields) => {
        err ? console.log(err) : res.send(rows);
    })
});

app.post('/medsys_insertrequisition', function(req, res){
    let querySql = `INSERT INTO medsys_pinpassword (pin, idusuario, ativo) VALUES  ('${req.body.pin}', '${req.body.idusuario}', 'TRUE')`;
    mysqlConnection.query(querySql, (err, rows, fields) => {
        err ? console.log(err) : res.send(true);
    })
});

app.post('/medsys_updatepassword', function(req, res){
    const password = req.body.password;
    const passwCrypt = encryptPassword(password);
    let querySql = `UPDATE medsys_usuario SET senha = '${passwCrypt}' WHERE idusuario = '${req.body.idusuario}'`;
    mysqlConnection.query(querySql, (err, rows, fields) => {
        err ? console.log(err) : res.send(true);
    })
});

app.post('/medsys_newEmail', function(req, res){
    sendNewEmail(req.body.email,req.body.pin);
    res.send(true);
});

function encryptPassword(passw){
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(passw, salt);
    return hash;
}

let testAccount = nodemailer.createTestAccount();
var transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    auth: {
        user: "de905372567fc9",
        pass: "e167bca521e171"
    }
});

timer();
async function timer() {
    setInterval(async () => {
        const now = new Date().toLocaleString('en-US', { hour12: false })
        console.log(now);
        mysqlConnection.query(`SELECT * FROM medsys_pinpassword WHERE ativo = 'TRUE' LIMIT 1`, (err, rows, fields) => {
            if(!err){
                if (rows[0]) {
                    searchUser(rows[0]);
                }
            }else console.log(err);
        })
    }, 2000);
}

async function searchUser(data) {
    let querySql = `SELECT email FROM medsys_usuario WHERE idusuario = ${data.idusuario}`;
    let email;
    mysqlConnection.query(querySql, (err, rows, fields) => {
        !err ? email = rows[0].email : console.log(err);
        sendEmail(email,data.pin,data.idrequisicao);
    }) 
}

async function sendEmail(email, pin, idrequisicao){
    let querySql = `UPDATE medsys_pinpassword SET ativo = 'FALSE' WHERE idrequisicao = ${idrequisicao}`;
    mysqlConnection.query(querySql, (err, rows, fields) => {
        !err ? console.log('Requisição FALSE') : console.log(err);
    }) 
    sendNewEmail(email,pin)
    setTimeout(() => {
        let querySql = `DELETE FROM medsys_pinpassword WHERE idrequisicao = ${idrequisicao}`;
        mysqlConnection.query(querySql, (err, rows, fields) => {
            !err ? console.log('Requisição excluída') : console.log(err);
        }) 
    }, "120000")
}

function sendNewEmail(email,pin){
    console.log('email env');
    let info = transporter.sendMail({
        from: 'support@gmail.com',
        to: email,
        subject: "Código de verificação",
        html: `
            <p style='font-size: 18px; font-family: Arial;'>Por favor, em nossa página insira o código abaixo para confirmar sua identidade.</p> 
            <p style='font-size: 23px; font-family: Arial; font-weight: bold; text-align: center'>${pin}</p>
            <p style='font-size: 14px; font-family: Arial;'>Este código é válido por 120 segundos, contados a partir do recebimento deste e-mail.</p>
        `, 
    });
}