import React, { useState, useEffect, useRef } from 'react';
import { Form, Input, message as Message, Modal, Button } from 'antd';
import { connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './LoginPage.scss';
import { getUUID, LStorage } from '../utils/tools';
// import Store from 'electron-store'


import IMGS from '../imgs';
import Update from '../components/Update';
import { youshuLogin, youshuSmsCode } from '../api';

let times: number = 60;

function LoginPage() {
  const [loginType, setLoginType] = useState('mobile_code');
  const [codeText, setCodeText] = useState('获取验证码');
  const [form] = Form.useForm();
  const timerId: any = useRef(null);
  const curForm: any = useRef(null);
  curForm.current = form;
  const navigate = useNavigate();

  async function onFinish(values: any) {
    let { mobile, password, code } = values;

    youshuLogin({
      mobile: mobile,
      login_type: loginType,
      password: password,
      code: code,
    })
      .then(async (res) => {
        if (res.code == 1) {
          LStorage.setItem('USER_INFO', {
            userId: res.data.user_id,
            password: password,
            nick: res.data.nickname,
            avatar: res.data.avatar,
            role: 'ANCHOR',
            mobile,
            app: 10120, // 有师：10110，有书：10120
            liveToken: res.data.remember_token,
          });
          setTimeout(async () => {
            console.log('====', LStorage.getItem('USER_INFO'));

            navigate('/live-list', {
              replace: true,
            });
          }, 1000);
        } else if (res.code == 6010010) {
          Message.warning('密码错误');
        } else {
          Message.warning(`${res.code}--${res.msg}`);
        }
      })
      .catch((err) => {
        // console.log('err', err);
        Message.warning(`当前网络不可用，请检查网络状态`);
      });
  }

  function sendSMS() {
    if (codeText != '获取验证码') return;

    // @ts-ignore
    let phone = curForm.current.getFieldValue('mobile');

    let checkMobile = /^1(3|4|5|6|7|8|9)[0-9]\d{8}$/;
    if (!checkMobile.test(phone)) {
      Message.warning('请输入合法手机号！');
      return;
    }

    youshuSmsCode({
      mobile: Number(phone),
    })
      .then((res) => {
        if (res.code == 1) {
          timerId.current = setInterval(() => {
            times--;
            setCodeText(`${times}后重新获取`);
            if (times == 0) {
              times = 60;
              setCodeText('获取验证码');
              clearInterval(timerId.current);
            }
          }, 1000);
        }
      })
      .catch((err) => {
        console.log('err', err);
        Message.warning(`当前网络不可用，请检查网络状态`);
      });
  }

  useEffect(() => {
    if (!LStorage.getItem('DEVICE_ID')) {
      LStorage.setItem('DEVICE_ID', getUUID());
    }

    const userInfo = LStorage.getItem('USER_INFO') && LStorage.getItem('USER_INFO').app == 10120 ? LStorage.getItem('USER_INFO') : {};
    LStorage.setItem('USER_INFO', {
      ...userInfo,
      liveToken: "",
    });
    curForm.current.setFieldsValue({
      mobile: userInfo.mobile || '',
      password: userInfo.password || '',
    })
  }, [])

  return (
    <div className="login-wrap">
      {/* <img src={IMGS.LOGIN_BG} alt="" className="login-bg" /> */}
      <div className="login-container">
        {/* <img src={IMGS.LOGIN_LOGO_2} alt="loginlogo" className="title" /> */}
        <div className="login-nav">
          <div
            onClick={() => setLoginType('mobile_code')}
            className={
              loginType == 'mobile_code'
                ? 'nav-item active youshu-active'
                : 'nav-item'
            }
          >
            验证码登录
          </div>
          <div
            onClick={() => setLoginType('mobile')}
            className={
              loginType == 'mobile'
                ? 'nav-item active youshu-active'
                : 'nav-item'
            }
          >
            密码登录
          </div>
        </div>
        <Form
          name="normal_login"
          form={form}
          className="login-form"
          labelAlign="left"
          onFinish={onFinish}
        >
          <Form.Item
            name="mobile"
            label="手机号 "
            colon={false}
            shouldUpdate
            rules={[
              { required: true, message: '请输入手机号!', max: 11 },
              ({ getFieldValue }) => ({
                validator(_, e: any) {
                  const value = getFieldValue('mobile');
                  if (value) {
                    if (value.length === 11 && !/^1\d{10}$/.test(value)) {
                      return Promise.reject(
                        new Error('请输入11位有效手机号！'),
                      );
                    }
                    if (value.length !== 11 && value.length !== 0) {
                      return Promise.reject(new Error('请输入11位手机号！'));
                    }
                    return Promise.resolve();
                  }
                  return Promise.resolve();
                },
              }),
            ]}
          >
            <Input placeholder="请输入手机号" allowClear />
          </Form.Item>
          {loginType == 'mobile' ? (
            <Form.Item
              name="password"
              label="密码"
              colon={false}
              shouldUpdate
              rules={[{ required: true, message: '请输入密码!' }]}
            >
              <Input type="password" placeholder="请输入密码" allowClear />
            </Form.Item>
          ) : null}
          {loginType == 'mobile_code' ? (
            <div className="login-code">
              <Form.Item
                name="code"
                label="验证码"
                colon={false}
                shouldUpdate
                rules={[{ required: true, message: '请输入验证码!' }]}
              >
                <Input placeholder="请输入验证码" allowClear />
              </Form.Item>
              <p
                onClick={sendSMS}
                className={
                  codeText == '获取验证码'
                    ? 'login-code-btn active active-youshu'
                    : 'login-code-btn'
                }
              >
                {codeText}
              </p>
            </div>
          ) : null}
          <button className="login-btn">登录</button>

          <Update></Update>
        </Form>
      </div>
    </div>
  );
}

export default LoginPage;