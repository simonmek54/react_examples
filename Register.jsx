import React, {Component} from 'react';
import 'whatwg-fetch';
import 'formdata-polyfill'
import {Modal} from 'react-bootstrap';
import MaskedInput from 'react-text-mask'
import emailMask from 'text-mask-addons/dist/emailMask'
import RegistrationSuccess from "../Registration/RegistrationSuccess.jsx";


export default class Register extends Component {

    constructor(props) {
        super(props);
        this.state = {
            form: {},
            errors: {},
            showPass: false,
            disableSubmit: true,
            email: '',
            showSuccess: false,
            showSmsConfirm: false,
            showFailureModal: false,
            error: null,
        };
        this.fields = [
            'email',
            'phone',
            'password',
            'confirm_password',
            'first_name',
            'last_name',
            'agree_rules',
        ];

        this.submitRegister = this.submitRegister.bind(this);
        this.register = this.register.bind(this);
        this.checkRegisterFields = this.checkRegisterFields.bind(this);
        this.onChangeInput = this.onChangeInput.bind(this);
        this.generatePassword = this.generatePassword.bind(this);
        this.togglePassword = this.togglePassword.bind(this);

    }

    checkRegisterFields = () => {
        let {form} = this.state;
        let errors = {};
        let formAll = false;
        if (form && form.phone && form.password && form.confirm_password && form.first_name && form.last_name && form.email && form.agree_rules) {
            formAll = true;
        }
        if (form) {
            if (form.phone) {
                let phone = this.phoneReplacer(form.phone);
                if (phone.length < 12) {
                    errors.phone = 'Неправильный формат телефона';
                } else {
                    // this.checkPhone(form.phone);
                }
            }
            if (form.password) {
                if (!(form.password.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{6,}$/) && form.password.length >= 6)) {
                    errors.password = 'Пароль должен содержать: Не менее одной заглавной английской буквы, Не менее одной строчной английской буквы, Не менее одной цифры, Иметь минимальную длину шесть символов.';
                }
            }
            if (form.confirm_password) {
                if (form.confirm_password !== form.password) {
                    errors.confirm_password = 'Введенные пароли не совпадают'
                }
            }
            if (form.first_name) {
                if (!(form.first_name.match(/^[а-яА-Я]+/u) && form.first_name.length >= 0)) {
                    errors.first_name = 'Допустимы только русские буквы';
                }
            }
            if (form.last_name) {
                if (!(form.last_name.match(/^[а-яА-Я]+/u) && form.last_name.length >= 0)) {
                    errors.last_name = 'Допустимы только русские буквы';
                }
            }
            if (form.email) {
                if (!(form.email.match(/(.+)@(.+)\.(.+)/g))) {
                    errors.email = 'Некорректный формат E-Mail';
                } else {
                    // this.checkEmail(form.email);
                }
            }
            if (form.agree_rules) {
                if (form.agree_rules !== 'onn') {
                    errors.agree_rules = 'Подтвердите соглашение с правилами программы';
                }
            }


            if (Object.entries(errors).length === 0 && formAll) {
                this.setState({disableSubmit: false});
            } else {
                this.setState({disableSubmit: true});
            }
            this.setState({errors: errors});
        }
    };

    checkEmail = (email) => {
        const formData = new FormData();
        formData.append('email', email);
        let status;
        fetch('/user_api/user/check_email/', {
            method: 'post',
            body: formData
        })
            .then((response) => {
                status = response.status;
                if (response.status === 200) {
                    return response.json();
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                const {errors} = this.state;
                if (status != 200) {
                    errors.email = data;
                    this.setState({errors: errors});
                } else {
                    errors.email = '';
                    this.setState({errors: errors});
                }
            });
    };
    phoneReplacer = (phone) => {
        phone = phone.replace(/\s/g, '');
        phone = phone.replace(/\(/g, '');
        phone = phone.replace(/\)/g, '');
        phone = phone.replace(/_/g, '');
        phone = phone.replace(/-/g, '');
        return phone;
    };

    checkPhone = (phone) => {
        phone = this.phoneReplacer(phone);
        if (phone.length < 12) {
            return;
        }

        const formData = new FormData();

        formData.append('phone', phone);

        let status;
        fetch('/user_api/user/check_phone/', {
            method: 'post',
            body: formData
        })
            .then((response) => {
                status = response.status;
                if (response.status === 200) {
                    return response.json();
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                const {errors} = this.state;
                if (status != 200) {
                    errors.phone = data;
                    this.setState({errors: errors});
                } else {
                    errors.phone = '';
                    this.setState({errors: errors});
                }
            });
    };

    submitRegister = (e) => {
        e.preventDefault();

        let formData = new FormData(e.target);

        this.setState({error: null, errors: {}, showFailureModal: false}, () => {
            let status;
            fetch('/user_api/user/validate/', {
                method: 'POST',
                body: formData,
                credentials: 'same-origin'
            })
                .then((response) => {
                    status = response.status;
                    if (response.status == 200) {
                        return response.json();
                    } else {
                        return response.text();
                    }
                })
                .then((data) => {
                    if (status == 200) {
                        this.setState({form: formData}, () => {
//                        this.setState({ showSmsConfirm: true });
                            this.register();
                        })
                    } else {
                        let json = JSON.parse(data);
                        let responseFormErrors = {};
                        let responseErrors = [];
                        for (let key in json) {
                            if (this.fields.indexOf(key) >= 0) {
                                responseFormErrors[key] = json[key];
                            } else {
                                responseErrors.push(json[key]);
                            }
                        }
                        if (responseErrors.length>0){
                            this.setState({
                                errors: responseFormErrors,
                                error: responseErrors,
                                showFailureModal: true,
                                disableSubmit: true,
                            });
                        }else{
                            this.setState({
                                errors: responseFormErrors,
                                disableSubmit: true,
                            });
                        }

                    }
                })
        })

    };

    register = (e) => {
        let {form} = this.state;
        let status;
        fetch('/user_api/user/register/', {
            method: 'POST',
            body: form,
            credentials: 'same-origin'
        })
            .then((response) => {
                status = response.status;
                if (response.status == 200) {
                    return response.json();
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                if (status == 200) {
                    this.setState({email: form.get('email'), form: null, showSuccess: true, showSmsConfirm: false});

                } else {
                    let json = JSON.parse(data);
                    let responseFormErrors = {};
                    let responseErrors = [];
                    for (let key in json) {
                        if (this.fields.indexOf(key) >= 0) {
                            responseFormErrors[key] = json[key];
                        } else {
                            responseErrors.push(json[key]);
                        }
                    }
                    if (responseErrors.length>0){
                        this.setState({
                            errors: responseFormErrors,
                            error: responseErrors,
                            showFailureModal: true,
                            disableSubmit: true,
                        });
                    }else {
                        this.setState({
                            errors: responseFormErrors,
                            disableSubmit: true,
                        });
                    }
                }
            })
    };

    hideFailureModal = () => {
        this.setState({showFailureModal: false, error: null})
    };

    onChangeInput = (event) => {
        let formData = new FormData(event.target.form);
        let formValues = {};
        formData.forEach(function (val, key) {
            formValues[key] = val;
            if(key == "phone" && val == '+7 (___) ___-__-__'){
                formValues[key] = "";
            }
        });
        // console.log(formValues);
        this.state.form = formValues;
        this.checkRegisterFields();
        window.elijah.markEmptyFields(event.target);
    };

    togglePassword = () => {
        const {showPass} = this.state;
        this.setState({showPass: !showPass});
    };

    generatePassword = () => {
        let {form} = this.state;
        // console.log(form);
        // if (!form) {
        //     form = {};
        // }
        let randomPass = '';
        // let randomPass = new Array(12).fill().map(() => String.fromCharCode(Math.random()*86+40)).join("");
        while (!randomPass.match(/^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{6,}$/)) {
            randomPass = Array.apply(null, Array(8)).map(function () {
                var c = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                return c.charAt(Math.random() * c.length);
            }).join('');
        }
        form.password = randomPass;
        form.confirm_password = randomPass;

        this.setState({form: form});
    };

    render() {
        const {showFailureModal, error, email, showPass, showSuccess, form, errors, disableSubmit} = this.state;
        const errorTokens = error ? error.reduce((carry, item) => {
            if (item) {
                if (item === 'ru' && carry.length) {
                    carry[carry.length - 1] = carry[carry.length - 1] + '.' + item;
                } else {
                    carry.push(item.trim());
                }
            }
            return carry;
        }, []) : [];
        return (
            <div>
                <form className="row" role="form" ref="register_form" onSubmit={this.submitRegister} onKeyDown={(e) => {
                    if (e.keyCode == 13) {
                        this.submitRegister();
                    }
                }}>
                    <div className="offset-xl-3 col-xl-6 offset-md-2 col-md-8">
                        <div className="row">
                            <div className="col-md-7">
                                <label className="form_input-wrapper -secondary- -md-">
                                    <input
                                        className={`form_input -is-empty- -secondary- -md- ${(errors && errors.last_name) ? "-is-invalid-" : ""}`}
                                        autoComplete="off"
                                        onChange={this.onChangeInput}
                                        name="last_name"
                                        value={form && form.last_name ? form.last_name : ""}
                                        type="text"/>
                                    <span className="form_input-label">Фамилия*</span>
                                    <span
                                        className="form_input-error">{errors && errors.last_name ? errors.last_name : ""}</span>
                                    <div className="form_input-icon icon-login"></div>
                                </label>
                            </div>
                            <div className="col-md-5">
                                <label className="form_input-wrapper -secondary- -md-">
                                    <input
                                        className={`form_input -is-empty- -secondary- -md- ${(errors && errors.first_name) ? "-is-invalid-" : ""}`}
                                        autoComplete="off"
                                        onChange={this.onChangeInput}
                                        value={form && form.first_name ? form.first_name : ""}
                                        name="first_name"
                                        type="text"/>
                                    <span className="form_input-label">Имя*</span>
                                    <span
                                        className="form_input-error">{errors && errors.first_name ? errors.first_name : ""}</span>
                                    <div className="form_input-icon icon-login"></div>
                                </label>
                            </div>
                            <div className="col-12">
                                <label className="form_input-wrapper -secondary- -md-">
                                    <MaskedInput
                                        mask={emailMask}
                                        guide={false}
                                        placeholderChar={'_'}
                                        className={`form_input -is-empty- -secondary- -md- ${(errors && errors.email) ? "-is-invalid-" : ""}`}
                                        autoComplete="off"
                                        onChange={this.onChangeInput}
                                        value={form && form.email ? form.email : ""}
                                        name="email"
                                        type="text"
                                    />
                                    <span className="form_input-label">Электронная почта*</span>
                                    <span
                                        className="form_input-error">{errors && errors.email ? errors.email : ""}</span>
                                    <div className="form_input-icon icon-email"></div>
                                </label>
                            </div>
                            <div className="col-12">
                                <label className="form_input-wrapper -secondary- -md-">
                                    <input
                                        className={`form_input -is-empty- -secondary- -md- ${(errors && errors.phone) ? "-is-invalid-" : ""}`}
                                        autoComplete="off"
                                        onChange={this.onChangeInput}
                                        onKeyUp={this.onChangeInput}
                                        value={form && form.phone ? form.phone : ""}
                                        name="phone"
                                        type="tel"/>
                                    <span className="form_input-label">Телефон*</span>
                                    <span
                                        className="form_input-error">{errors && errors.phone ? errors.phone : ""}</span>
                                    <div className="form_input-icon icon-phone"></div>
                                </label>
                            </div>
                            <div className="col-md-6">
                                <label className="form_input-wrapper -secondary- -md-">
                                    <input
                                        className={`form_input -is-empty- -secondary- -md- ${(errors && errors.password) ? "-is-invalid-" : ""}`}
                                        autoComplete="off"
                                        onChange={this.onChangeInput}
                                        value={form && form.password ? form.password : ""}
                                        name="password"
                                        type={showPass ? "text" : "password"}/>
                                    <span className="form_input-label">Пароль*</span>
                                    <span
                                        className="form_input-error">{errors && errors.password ? errors.password : ""}</span>
                                    <button className="btn_reset form_input-btn" type="button"
                                            onClick={this.generatePassword}>сгенерировать
                                    </button>
                                    <div className="form_input-icon icon-password"></div>
                                </label>
                            </div>
                            <div className="col-md-6">
                                <label className="form_input-wrapper -secondary- -md-">
                                    <input
                                        className={`form_input -is-empty- -secondary- -md- ${(errors && errors.confirm_password) ? "-is-invalid-" : ""}`}
                                        autoComplete="off"
                                        onChange={this.onChangeInput}
                                        value={form && form.confirm_password ? form.confirm_password : ""}
                                        name="confirm_password"
                                        type={showPass ? "text" : "password"}/>
                                    <span className="form_input-label">Повтор пароля*</span>
                                    <span
                                        className="form_input-error">{errors && errors.confirm_password ? errors.confirm_password : ""}</span>
                                    <button className="btn_reset form_input-btn" type="button"
                                            onClick={this.togglePassword}>{showPass ? "скрыть пароль" : "показать пароль"}</button>

                                    <div className="form_input-icon icon-password"></div>
                                </label>
                            </div>
                            <div className="col-12">
                                <label className="form_input-wrapper">
                                    <input
                                        className={`form_input ${(errors && errors.agree_rules) ? "-is-invalid-" : ""}`}
                                        onChange={this.onChangeInput}
                                        name="agree_rules"
                                        value="onn"
                                        type="checkbox"
                                        ref="agree_rules"/>
                                    <span className="form_input-label">
                                               <span>Согласие с <a className="-reverse-" href="/pdf/rules.pdf"
                                                                   target="_blank">Правилами и Политикой</a></span></span>
                                    <span
                                        className="form_input-error">{errors && errors.agree_rules ? errors.agree_rules : ""}</span>
                                </label>
                            </div>
                        </div>
                    </div>
                    <div className="w-100" style={{height: "20px"}}></div>
                    <div className="col-12 text-center register-actions">
                        <button className="btn_custom -secondary- button-login" type="submit"
                                disabled={disableSubmit}>Зарегистрироваться
                        </button>
                    </div>
                    <div className="w-100" style={{height: "20px"}}></div>
                </form>

                {/*<SmsConfirmForm*/}
                {/*    show={showSmsConfirm}*/}
                {/*    callback={this.register}*/}
                {/*    phone={this.state.phone}*/}
                {/*    onHide={() => {*/}
                {/*        this.setState({showSmsConfirm: false});*/}
                {/*    }}*/}
                {/*/>*/}
                <Modal
                    show={showFailureModal}
                    onHide={this.hideFailureModal}
                    className="modal-block login-error"
                >
                    <div className="modal-body" style={{background: '#5b0538', textAlign: 'center',padding:'30px'}}>
                        {
                            error &&
                             <div style={{paddingBottom: '20px'}}>
                                <h1> Ошибка! </h1>
                                {
                                    errorTokens.slice(1).map((item, key) => {
                                        return (
                                            <p key={key} style={{
                                                fontSize: '18px',
                                                textTransform: 'none'
                                            }}>
                                                {item}
                                            </p>
                                        );
                                    })
                                }
                            </div>
                        }
                        <div className="text-center">
                            <button className="btn_custom -secondary-" onClick={this.hideFailureModal}>OK</button>
                        </div>
                    </div>
                </Modal>

                <RegistrationSuccess
                    email={email}
                    show={showSuccess}
                    onHide={() => {
                        localStorage.setItem('email', email);
                        window.location = '/';
                    }}
                />
            </div>
        );
    }
}