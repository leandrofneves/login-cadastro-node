let _email = '', _idusuario = '';

function showLogin(){$('#reg-log').prop('checked', false)}

function showRegister(){$('#reg-log').prop('checked', true)}

function showRemember(){
    Swal.fire({
        title: 'Informe seu email',
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        showLoaderOnConfirm: true,
        preConfirm: (email) => {
            if(email){
                const user = API('medsys_searchusers',{email: email});
                if (!user){
                    Swal.showValidationMessage(`Email inválido`);
                    return;
                }
                let generateNumber = [];
                for (let x = 0; x <= 4; x++) generateNumber[x] = Math.floor(Math.random() * 10);
                let pin = generateNumber.join('');
                const requisition = API('medsys_insertrequisition',{idusuario: user.idusuario, pin})
                if(requisition){
                    _idusuario = user.idusuario;
                    showConfirmPIN(pin,email)
                }
                
            }else Swal.showValidationMessage(`Informe seu email`);
        },
        allowOutsideClick: () => !Swal.isLoading()
    })
}

function showConfirmPIN(pin,email){
    _email = email;
    Swal.fire({
        title: 'Enviamos um código para você!',
        html: `Insira abaixo o código de verificação que enviamos para o seu email.<br>Não recebeu nosso email? <a href='#' style='text-decoration: none;' onclick='sendNewEmail(${pin});'>Solicite o reenvio.</a>`,
        input: 'text',
        inputAttributes: {
          autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        showLoaderOnConfirm: true,
        preConfirm: (code) => {
            if(code == pin) showNewPassw()
            else {
                Swal.showValidationMessage(`PIN incorreto!`);
            }
        },
        allowOutsideClick: () => !Swal.isLoading()
    })
}

function sendNewEmail(pin){
    API('medsys_newEmail',{email: _email, pin: pin});
    toasts('success','Reenviamos o email de verificação! Aguarde um momento...');
    setTimeout(() => {
        showConfirmPIN(pin,_email)
    }, "3000")
}

function showNewPassw(){
    Swal.fire({
        title: 'Informe uma nova senha',
        input: 'password',
        inputAttributes: {
          autocapitalize: 'off'
        },
        showCancelButton: true,
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
        showLoaderOnConfirm: true,
        preConfirm: (passw) => {
            if (passw) {
                const update_passw = API('medsys_updatepassword',{password: passw, idusuario: _idusuario})
                if(update_passw) toasts('success','Senha alterada com sucesso!')
            }else Swal.showValidationMessage(`Informe a nova senha!`);
        },
        allowOutsideClick: () => !Swal.isLoading()
    })
}

function registerUser(){
    if (!$('#username_reg').val() || !$('#email_reg').val() || !$('#pass_reg').val() || !$('#passconfirm_reg').val()) {
        toasts('error', 'Preencha todos os campos!');
        return;
    }   
    if (!validateEmail($('#email_reg').val())) {
        toasts('error', 'Email inválido');
        return;
    }
    if($('#pass_reg').val() != $('#passconfirm_reg').val()){
        toasts('error', 'As senhas são diferentes!');
        return;
    }
    let data = {
        name: $('#username_reg').val(), 
        email: $('#email_reg').val(),  
        password: $('#pass_reg').val()
    };
    API('medsys_insertuser', data)
    toasts('success','Cadastro realizado com sucesso!');
    showLogin();
    $('#username_reg').val('')
    $('#email_reg').val('')
    $('#pass_reg').val('')
    $('#passconfirm_reg').val('')
}

function login(){
    if (!$('#email_login').val() || !$('#pass_login').val()) {
        toasts('error', 'Preencha todos os campos!');
        return;
    }   
    const user = API('medsys_checkuser',{email: $('#email_login').val(), passw: $('#pass_login').val()});
    
    !user ? toasts('error', 'Usuário ou senha inválido(s)!') : toasts('success', 'Usuário apto a entrar no sistema!');
}

function validateEmail(email) {
    var regex = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return regex.test(email);
}

function toasts(type, msg){
    let toastMixin = Swal.mixin({
        toast: true,
        icon: type,
        title: 'General Title',
        animation: false,
        position: 'top-right',
        showConfirmButton: false,
        timer: 3300,
        timerProgressBar: true,
        didOpen: (toast) => {
          toast.addEventListener('mouseenter', Swal.stopTimer)
          toast.addEventListener('mouseleave', Swal.resumeTimer)
        }
    });
    toastMixin.fire({
        animation: true,
        title: msg
    });
}

function API(name_api, obj){
    let result;
    $.ajax({
        type: 'POST',
        data: JSON.stringify(obj),
        contentType: 'application/json',
        url: 'http://localhost:3000/'+name_api,	
        async: false,					
        success: function(data) {
           result = data;
        } 
    });
    return result;
}