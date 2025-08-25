import React, { useEffect, useState, useRef } from 'react';
// import Store from 'electron-store';
import { Button, Progress, Select, Slider, Radio } from 'antd';
import { CloseOutlined, LoadingOutlined } from '@ant-design/icons';
import './test.scss';
import pkg from '../../../package.json';
var os = require('os');
// import { execSync } from 'child_process';
import publicIp from 'public-ip';
import { LStorage } from '../utils/tools';

import ImgIcon from '../components/ImgIcon';

import {
  setDevice,
  setLog,
  setValue,
  setOperateLog,
} from '../reducers/roomConfigSlice';

import { RESOURCE_PATH, npm_env } from '../config';
import {
  LIVE_ACTIONS,
  StatisticsWarn,
  OPERATE_ACTION,
} from '../vars/room-vars';

// const store: any = new Store();

interface TestPropsParam {
  ysLiveClient: any;
  dispatch: any;
  roomConfig: any;
  setMirror: any;
}

enum QUALITY_MAP {
  '差' = 4,
  '不可用' = 6,
  '最好' = 1,
  '好' = 2,
  '一般' = 3,
  '未知' = 0,
  '很差' = 5,
  '超时' = 7,
}

export default function Test(props: TestPropsParam) {
  const { ysLiveClient, dispatch, roomConfig, setMirror } = props;
  const {
    cameraList,
    speakerList,
    micList,
    camera,
    speaker,
    mic,
    imIsLogin,
    isMirror,
  } = roomConfig;

  const [curMicVolume, setMicVolume] = useState(0);
  const [showBtn, setShowBtn] = useState(false);
  const [step, setStep] = useState(0);
  const [osVersion, setOsVersion] = useState({
    name: '',
    version: '',
  });
  const [ip, setIp] = useState('');
  const [precentCPU, setPrecentCPU] = useState(0);
  const [isCPUPass, setIsCPUPass] = useState(false);
  const [isOnLine, setIsOnLine] = useState(false);
  const testSpeedIng: any = useRef(false);
  const speedTestTimer: any = useRef(null);
  const [isTestSpeedIng, setIsTestSpeedIng] = useState(false);
  const [isCameraPass, setIsCameraPass] = useState(false);
  const [isSpeakerPass, setIsSpeakerPass] = useState(false);
  const [isMicpass, setIsMicPass] = useState(false);
  const [quality, setQuality] = useState('');

  function bindEvent() {
    ysLiveClient.on('TRTC_SPEAKER_VOLUME', onSpeakerTest);
    ysLiveClient.on('TRTC_MIC_VOLUME', onMicTest);
    ysLiveClient.on('TRTC_SPEED_TEST_RESULT', onSpeedTestResult);
  }

  // 开始摄像头测试
  function startCameraTest() {
    ysLiveClient.startCameraTest('camera-test-view');
  }

  // 停止摄像头测试
  function stopCameraTest(pass: boolean) {
    ysLiveClient.stopCameraTest();
    let cameraView: any = document.getElementById('camera-test-view');
    cameraView.childNodes[0] &&
      cameraView.removeChild(cameraView.childNodes[0]);
    setShowBtn(false);
    setStep(2);
    pass && setIsCameraPass(true);
    ysLiveClient.closeCamera();
  }

  // 选择摄像头
  function setCamera(deviceId: string) {
    dispatch(setDevice({ name: 'camera', device: { deviceId } }));
  }

  // 设置要使用的扬声器
  function setSpeaker(deviceId: string) {
    dispatch(setDevice({ name: 'speaker', device: { deviceId } }));
  }

  // 开始扬声器测试
  function startSpeakerTest() {
    // console.log(RESOURCE_PATH)
    ysLiveClient.startSpeakerTest(RESOURCE_PATH + '/test.mp3');
  }

  // 监听扬声器测试结果
  function onSpeakerTest(event: { data: { result: number } }) {
    // console.log('扬声器测试回调结果：', event)
  }

  function changeSpeakerVolume(volume: any) {
    dispatch(setDevice({ name: 'speaker', device: { volume } }));
  }

  // 停止扬声器测试
  function stopSpeakerTest(pass: boolean) {
    setShowBtn(false);
    ysLiveClient.stopSpeakerTest();
    setStep(3);
    pass && setIsSpeakerPass(true);
  }

  // 设置要使用的麦克风
  function setMic(deviceId: string) {
    dispatch(setDevice({ name: 'mic', device: { deviceId } }));
  }

  // 开始麦克风测试
  function startMicTest() {
    ysLiveClient.startMicTest(300);
    // ysLiveClient.setCurrentMicVolume(100)
  }

  // 监听麦克风测试结果
  function onMicTest(event: { data: { result: number } }) {
    // console.log('麦克风测试回调结果：', event)
    const result = event.data.result;
    setMicVolume(result);
  }

  // 停止麦克风测试
  function stopMicTest(pass: boolean) {
    setShowBtn(false);
    ysLiveClient.stopMicTest();
    setMicVolume(0);
    setStep(4);
    pass && setIsMicPass(true);
  }

  // 开始网络测速
  function startSpeedTest() {
    ysLiveClient.startSpeedTest();
    speedTestTimer.current = setTimeout(() => {
      clearTimeout(speedTestTimer.current);
      if (testSpeedIng.current) {
        // console.log('测速中...,提示超时');
        stopSpeedTest();
        // console.log('quality', QUALITY_MAP[7])
        setQuality(QUALITY_MAP[7]);
        setIsTestSpeedIng(false);
        testSpeedIng.current = false;
      } else {
        // console.log('测速结束');
      }
    }, 40000);
  }

  // 重试网络测速
  function restartSpeedTest() {
    setIsTestSpeedIng(true);
    setQuality('');
    testSpeedIng.current = true;
    setTimeout(() => {
      startSpeedTest();
    }, 1000);
  }

  // 停止网络测速
  function stopSpeedTest() {
    ysLiveClient.stopSpeedTest();
  }

  function onSpeedTestResult(result: any) {
    clearTimeout(speedTestTimer.current);
    // console.log('onSpeedTestResult', result)
    const quality = result.data.quality;
    stopSpeedTest();
    // console.log('quality', QUALITY_MAP[quality])
    setQuality(QUALITY_MAP[quality]);
    setIsTestSpeedIng(false);
    testSpeedIng.current = false;
  }

  // 重新检测
  function reCheck() {
    upData();
    // 重新检测前设置为原始状态
    setOsVersion({
      name: '',
      version: '',
    });
    setIp('');
    setQuality('');
    setPrecentCPU(0);

    setStep(1);
  }

  function unBindEvent() {
    ysLiveClient.off('TRTC_SPEAKER_VOLUME', onSpeakerTest);
    ysLiveClient.off('TRTC_MIC_VOLUME', onMicTest);
    ysLiveClient.off('TRTC_SPEED_TEST_RESULT', onSpeedTestResult);
  }

  // 开始检测
  function toCheck() {
    if (
      cameraList.length > 0 &&
      speakerList.length > 0 &&
      micList.length > 0 &&
      isOnLine
    ) {
      setStep(1);
    }
  }

  // 结束检测
  function checkOver() {
    upData();
    // dispatch(setDevice('speaker', { volume: 0 }))

    dispatch(setValue({ key: 'testVisibility', value: false }));
  }

  // 数据上报
  function upData() {
    // store.set('testedTime', new Date().getTime());
    LStorage.setItem('testedTime', new Date().getTime().toString());
    dispatch(setValue({ key: 'isTested', value: true }));
    // dispatch(
    //   setLog(LIVE_ACTIONS.testResult, {
    //     camera,
    //     mic,
    //     speaker,
    //     isCameraPass,
    //     isSpeakerPass,
    //     isMicpass,
    //     isOnLine,
    //     quality,
    //   }),
    // );
    // dispatch(
    //   setOperateLog(OPERATE_ACTION.live_env_check, {
    //     system: osVersion.name + osVersion.version,
    //     client_version: pkg.version,
    //     network_ip: ip,
    //     network_quality: quality,
    //     system_cpu_use_rate: precentCPU,
    //   }),
    // );
  }

  function testStep0() {
    return step == 0 ? (
      <div className="test-step0">
        <h1>准备检测</h1>
        <h3>为了保证更好的授课效果，请务必完成设备检测哦~</h3>
        <h4>为避免产生啸叫刺耳噪音请您佩戴耳机</h4>
        <div className="device">
          <div className="item">
            <ImgIcon.CameraTestC></ImgIcon.CameraTestC>
            {cameraList.length > 0 ? (
              <ImgIcon.Succeed></ImgIcon.Succeed>
            ) : (
              <ImgIcon.Failed></ImgIcon.Failed>
            )}
          </div>
          <div className="item">
            <ImgIcon.CeshiLink></ImgIcon.CeshiLink>
          </div>
          <div className="item">
            <ImgIcon.SpeakerTestC></ImgIcon.SpeakerTestC>
            {speakerList.length > 0 ? (
              <ImgIcon.Succeed></ImgIcon.Succeed>
            ) : (
              <ImgIcon.Failed></ImgIcon.Failed>
            )}
          </div>
          <div className="item">
            <ImgIcon.CeshiLink></ImgIcon.CeshiLink>
          </div>
          <div className="item">
            <ImgIcon.MicTestC></ImgIcon.MicTestC>
            {micList.length > 0 ? (
              <ImgIcon.Succeed></ImgIcon.Succeed>
            ) : (
              <ImgIcon.Failed></ImgIcon.Failed>
            )}
          </div>
          <div className="item">
            <ImgIcon.CeshiLink></ImgIcon.CeshiLink>
          </div>
          <div className="item">
            <ImgIcon.WifiTestC></ImgIcon.WifiTestC>
            {isOnLine ? (
              <ImgIcon.Succeed></ImgIcon.Succeed>
            ) : (
              <ImgIcon.Failed></ImgIcon.Failed>
            )}
          </div>
        </div>
        {cameraList.length > 0 &&
        speakerList.length > 0 &&
        micList.length > 0 &&
        isOnLine ? (
          <h2>设备、网络连接正常，可以开始检测啦</h2>
        ) : (
          <h2>
            {cameraList.length <= 0 &&
              '未检测到摄像头！检测过程中请务必链接摄像设备'}
            {speakerList.length <= 0 &&
              '未检测到监听设备！检测过程中请务必链接监听设备'}
            {micList.length <= 0 &&
              '未检测到麦克风！检测过程中请务必链接麦克风'}
            {!isOnLine && '未发现网络链接！检测过程中请务必保持网络通畅'}
          </h2>
        )}

        <button onClick={toCheck}>开始</button>
      </div>
    ) : null;
  }

  // 获取网络IP
  async function getIp() {
    let ip = (await publicIp.v4()) || '未知';
    setIp(ip);
  }

  // 获取 CPU 使用率
  function getCPUUsage() {
    const cpus = os.cpus();
    const totalCPU = cpus.reduce(
      (acc: any, cpu: any) => {
        const total = Object.values(cpu.times).reduce((a: any, b: any) => a + b, 0);
        const idle = cpu.times.idle;
        return {
          total: acc.total + total,
          idle: acc.idle + idle,
        };
      },
      { total: 0, idle: 0 },
    );

    return {
      total: totalCPU.total,
      idle: totalCPU.idle,
      usage: ((totalCPU.total - totalCPU.idle) / totalCPU.total) * 100,
    };
  }

  // 获取CPU使用状态
  function startCPUTest() {
    // 获取多次cpu，取最大
    let arr: any = [];
    let timer: any = setInterval(() => {
      //   arr.push(process.getCPUUsage().percentCPUUsage.toFixed(0));
      //获取当前cpu使用率
      const cpuUsage = getCPUUsage();
      console.log('cpuUsage', cpuUsage);
      arr.push(cpuUsage);
    }, 300);
    setTimeout(() => {
      // 结束计时器，取最大CPU
      clearInterval(timer);
      setPrecentCPU(Math.max(...arr));
      // 小与80通过检测
      if (Math.max(...arr) < StatisticsWarn.systemCpu) {
        setIsCPUPass(true);
      }
    }, 2000);
  }

  function onMirrorChange(e: any) {
    setMirror(e.target.value);
  }

  useEffect(() => {
    if (step == 1) {
      // 网络测速慢，提前开始测速
      setIsTestSpeedIng(true);
      testSpeedIng.current = true;
      startSpeedTest();

      setTimeout(() => {
        startCameraTest();
      }, 100);
      setTimeout(() => {
        setShowBtn(true);
      }, 500);
    } else if (step == 2) {
      dispatch(setDevice({ name: 'speaker', device: { volume: 50 } }));
      setTimeout(() => {
        setShowBtn(true);
      }, 500);
    } else if (step == 3) {
      setTimeout(() => {
        startMicTest();
      }, 800);
      setTimeout(() => {
        setShowBtn(true);
      }, 1500);
    } else if (step == 4) {
      // setIsTestSpeedIng(true)
      // testSpeedIng.current = true
      // startSpeedTest()
      startCPUTest();

      setTimeout(() => {
        // @ts-ignore
        let label = {
          name: '',
          version: '',
        };
        let osType = os.type();
        switch (osType) {
          case 'Darwin':
            label = {
              name: 'macOS ',
              version: os.release(),
              //   version: execSync('sw_vers -productVersion').toString().trim(),
            };
            break;
          case 'Linux':
            label = {
              name: 'linux ',
              version: '',
            };
            break;
          case 'Windows_NT':
            label = {
              name: 'windows ',
              version: process.getSystemVersion(),
            };
            break;
          default:
            label = {
              name: '未知',
              version: '',
            };
        }
        setOsVersion(label);
        getIp().then();
        // stopSpeedTest()
      }, 2000);
    } else if (step == 5) {
      ysLiveClient.stopMicTest();
    } else {
    }
    return () => {};
  }, [step]);

  useEffect(() => {
    if (ysLiveClient) {
      setIsOnLine(navigator.onLine);
      bindEvent();
    }

    return () => {
      ysLiveClient && unBindEvent();
    };
  }, [ysLiveClient]);

  useEffect(() => {}, [
    cameraList.length,
    speakerList.length,
    micList.length,
    isOnLine,
  ]);

  return (
    <div className="test-wrap">
      <div className="test-content">
        {step == 0 ? (
          <CloseOutlined
            className="test-close"
            onClick={() =>
              dispatch(setValue({ key: 'testVisibility', value: false }))
            }
          />
        ) : null}
        {testStep0()}

        {step > 0 && step < 5 ? (
          <div className="test-steps">
            <div className="device">
              <div className="item">
                {step >= 1 ? (
                  <ImgIcon.CameraTestC></ImgIcon.CameraTestC>
                ) : (
                  <ImgIcon.CameraTest></ImgIcon.CameraTest>
                )}
                {/*<ImgIcon.Succeed></ImgIcon.Succeed>*/}
              </div>
              <div className="item">
                <ImgIcon.CeshiLink></ImgIcon.CeshiLink>
              </div>
              <div className="item">
                {step >= 2 ? (
                  <ImgIcon.SpeakerTestC></ImgIcon.SpeakerTestC>
                ) : (
                  <ImgIcon.SpeakerTest></ImgIcon.SpeakerTest>
                )}
                {/*<ImgIcon.Succeed></ImgIcon.Succeed>*/}
              </div>
              <div className="item">
                <ImgIcon.CeshiLink></ImgIcon.CeshiLink>
              </div>
              <div className="item">
                {step >= 3 ? (
                  <ImgIcon.MicTestC></ImgIcon.MicTestC>
                ) : (
                  <ImgIcon.MicTest></ImgIcon.MicTest>
                )}
                {/*<ImgIcon.Succeed></ImgIcon.Succeed>*/}
              </div>
              <div className="item">
                <ImgIcon.CeshiLink></ImgIcon.CeshiLink>
              </div>
              <div className="item">
                {step >= 4 ? (
                  <ImgIcon.DeviceTestC></ImgIcon.DeviceTestC>
                ) : (
                  <ImgIcon.DeviceTest></ImgIcon.DeviceTest>
                )}
                {/*<ImgIcon.Succeed></ImgIcon.Succeed>*/}
              </div>
            </div>
          </div>
        ) : null}

        {step == 1 ? (
          <div className="test-step1">
            <div className="step-select">
              <p className="step-label">选择摄像头</p>
              <Select
                value={camera.deviceId}
                onChange={setCamera}
                style={{ width: 400 }}
              >
                {cameraList &&
                  cameraList.map((el: any) => {
                    return (
                      <Select.Option key={el.deviceId} value={el.deviceId}>
                        {el.deviceName}
                      </Select.Option>
                    );
                  })}
              </Select>
            </div>
            <div id="camera-test-view"></div>
            <div className="step-select">
              <p
                className="step-label"
                style={{ display: 'inline-block', marginRight: '30px' }}
              >
                镜像
              </p>
              <Radio.Group onChange={onMirrorChange} value={isMirror}>
                <Radio value={true}>开启</Radio>
                <Radio value={false}>关闭</Radio>
              </Radio.Group>
            </div>
            <p className="step1-text">通过摄像头能清晰的看到自己吗？</p>
            {showBtn ? (
              <div className="step-btns">
                <button className="btn-l" onClick={() => stopCameraTest(false)}>
                  看不到
                </button>
                <button className="btn-r" onClick={() => stopCameraTest(true)}>
                  能看到
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {step == 2 ? (
          <div className="test-step2">
            <div className="step-select">
              <p className="step-label">选择扬声器</p>
              <Select
                value={speaker.deviceId}
                onChange={setSpeaker}
                style={{ width: 400 }}
              >
                {speakerList &&
                  speakerList.map((el: any) => {
                    return (
                      <Select.Option key={el.deviceId} value={el.deviceId}>
                        {el.deviceName}
                      </Select.Option>
                    );
                  })}
              </Select>
            </div>

            <Button
              className="step2-btn"
              size="middle"
              onClick={startSpeakerTest}
            >
              点击测试播放
            </Button>

            <div className="step-volume">
              <p>输出音量：</p>
              <Slider
                value={speaker.volume}
                onChange={changeSpeakerVolume}
              ></Slider>
            </div>
            <p className="step1-text">通过扬声器能清晰的听到声音吗？</p>
            {showBtn ? (
              <div className="step-btns">
                <button
                  className="btn-l"
                  onClick={() => stopSpeakerTest(false)}
                >
                  听不到
                </button>
                <button className="btn-r" onClick={() => stopSpeakerTest(true)}>
                  能听到
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {step == 3 ? (
          <div className="test-step3">
            <div className="step-select">
              <p className="step-label">选择麦克风</p>
              <Select
                value={mic.deviceId}
                onChange={setMic}
                style={{ width: 400 }}
              >
                {micList &&
                  micList.map((el: any) => {
                    return (
                      <Select.Option key={el.deviceId} value={el.deviceId}>
                        {el.deviceName}
                      </Select.Option>
                    );
                  })}
              </Select>
            </div>
            <p className="step-text">
              您可以对着麦克风从1数到10，并观察是否有跳动效果
            </p>
            <Progress percent={curMicVolume} steps={22} />

            <div className="step-volume">
              <p>输出音量：</p>
              <Slider
                value={speaker.volume}
                onChange={changeSpeakerVolume}
              ></Slider>
            </div>

            {/*<p className="step-text">能通过耳机听到声音并看到音量跳动效果吗？</p>*/}
            {showBtn ? (
              <div className="step-btns">
                <button className="btn-l" onClick={() => stopMicTest(false)}>
                  看不到
                </button>
                <button className="btn-r" onClick={() => stopMicTest(true)}>
                  能看到
                </button>
              </div>
            ) : null}
          </div>
        ) : null}

        {step == 4 ? (
          <div className="test-step4">
            <ul className="test-netlist">
              <li>
                <p>操作系统</p>
                {/*{isTestSpeedIng ? <LoadingOutlined /> : <p>{osVersion.name}{osVersion.version}</p>}*/}
                {!isTestSpeedIng || osVersion.name ? (
                  <p>
                    {osVersion.name}
                    {osVersion.version}
                  </p>
                ) : (
                  <p>
                    <LoadingOutlined />
                  </p>
                )}
              </li>
              <li>
                <p>客户端版本</p>
                {/*{isTestSpeedIng ? <LoadingOutlined /> : <p>{pkg.version}</p>}*/}
                {!isTestSpeedIng || pkg.version ? (
                  <p>
                    {pkg.version}
                    {npm_env == 'prod' ? null : npm_env}
                  </p>
                ) : (
                  <p>
                    <LoadingOutlined />
                  </p>
                )}
              </li>
              <li>
                <p>网络IP</p>
                {/*{isTestSpeedIng ? <LoadingOutlined /> : <p>{ip}</p>}*/}
                {!isTestSpeedIng || ip ? (
                  <p>{ip}</p>
                ) : (
                  <p>
                    <LoadingOutlined />
                  </p>
                )}
              </li>
              <li>
                <p>网络质量</p>
                {/*{isTestSpeedIng ? <LoadingOutlined /> : <p>{quality}</p>}*/}
                {!isTestSpeedIng || quality ? (
                  <p
                    onClick={() => {
                      quality == '超时' ? restartSpeedTest() : null;
                    }}
                  >
                    {quality == '超时' ? '超时(点击重试)' : quality}
                  </p>
                ) : (
                  <p>
                    <LoadingOutlined />
                  </p>
                )}
              </li>

              <li>
                <p>聊天室</p>
                <p>{imIsLogin ? '正常' : '异常'}</p>
              </li>

              <li>
                <p>系统CPU使用率</p>
                {!isTestSpeedIng || precentCPU ? (
                  <p
                    className={
                      precentCPU >= StatisticsWarn.systemCpu ? 'warning' : ''
                    }
                  >
                    {precentCPU}%
                  </p>
                ) : (
                  <p>
                    <LoadingOutlined />
                  </p>
                )}
                {precentCPU && precentCPU >= StatisticsWarn.systemCpu ? (
                  <div className="waning-tip">
                    当前系统CPU使用率过高，请关闭其他软件，避免直播卡顿
                  </div>
                ) : null}
              </li>
            </ul>
            {isTestSpeedIng ? null : (
              <div className="step-btns">
                <button className="btn-l" onClick={() => setStep(5)}>
                  完成
                </button>
              </div>
            )}
          </div>
        ) : null}

        {step == 5 ? (
          <div className="text-step5">
            <h2>检测报告</h2>
            <div className="step5-top">
              <div className="top-left">
                <p>操作系统</p>
                <p>客户端版本</p>
                <p>网络IP</p>
              </div>
              <div className="top-right">
                <p>
                  {osVersion.name}
                  {osVersion.version}
                </p>
                <p>
                  {pkg.version}
                  {npm_env == 'prod' ? null : npm_env}
                </p>
                <p>{ip}</p>
              </div>
            </div>
            <div className="step5-bottom">
              <div className="bot-item">
                <div className="item-lf">
                  <ImgIcon.TestCamera></ImgIcon.TestCamera>
                  <p>{camera.deviceName}</p>
                </div>
                {isCameraPass ? (
                  <div className="item-rf">
                    <p>能看到</p>
                    <ImgIcon.Succeed></ImgIcon.Succeed>
                  </div>
                ) : (
                  <div className="item-rf">
                    <p>看不到</p>
                    <ImgIcon.Failed></ImgIcon.Failed>
                  </div>
                )}
              </div>
              <div className="bot-item">
                <div className="item-lf">
                  <ImgIcon.TestSpeaker></ImgIcon.TestSpeaker>
                  <p>{speaker.deviceName}</p>
                </div>
                {isSpeakerPass ? (
                  <div className="item-rf">
                    <p>能听到</p>
                    <ImgIcon.Succeed></ImgIcon.Succeed>
                  </div>
                ) : (
                  <div className="item-rf">
                    <p>听不到</p>
                    <ImgIcon.Failed></ImgIcon.Failed>
                  </div>
                )}
              </div>
              <div className="bot-item">
                <div className="item-lf">
                  <ImgIcon.TestMic></ImgIcon.TestMic>
                  <p>{mic.deviceName}</p>
                </div>
                {isMicpass ? (
                  <div className="item-rf">
                    <p>能看到和听到</p>
                    <ImgIcon.Succeed></ImgIcon.Succeed>
                  </div>
                ) : (
                  <div className="item-rf">
                    <p>看不到听不到</p>
                    <ImgIcon.Failed></ImgIcon.Failed>
                  </div>
                )}
              </div>
              <div className="bot-item">
                <div className="item-lf">
                  <ImgIcon.TestWifi></ImgIcon.TestWifi>
                  <p>网络质量</p>
                </div>
                <div className="item-rf">
                  <p>{quality}</p>
                  <ImgIcon.Succeed></ImgIcon.Succeed>
                </div>
              </div>
              <div className="bot-item">
                <div className="item-lf">
                  <ImgIcon.Chat></ImgIcon.Chat>
                  <p>聊天室</p>
                </div>
                {imIsLogin ? (
                  <div className="item-rf">
                    <p>正常</p>
                    <ImgIcon.Succeed></ImgIcon.Succeed>
                  </div>
                ) : (
                  <div className="item-rf">
                    <p>异常</p>
                    <ImgIcon.Failed></ImgIcon.Failed>
                  </div>
                )}
              </div>
              <div className="bot-item">
                <div className="item-lf">
                  <ImgIcon.TestCPU></ImgIcon.TestCPU>
                  <p>系统CPU使用率</p>
                </div>
                {isCPUPass ? (
                  <div className="item-rf">
                    <p>{precentCPU}%</p>
                    <ImgIcon.Succeed></ImgIcon.Succeed>
                  </div>
                ) : (
                  <div className="item-rf">
                    <p>{precentCPU}%</p>
                    <ImgIcon.Failed></ImgIcon.Failed>
                  </div>
                )}
              </div>
            </div>
            {isMicpass &&
            isSpeakerPass &&
            isCameraPass &&
            isCPUPass &&
            imIsLogin ? (
              <p className="step-text">恭喜你！全都检测项目已达标！</p>
            ) : (
              <p className="step-text fail">
                部分检测项目未达标，可能会直接影响您的课程体验
              </p>
            )}

            <div className="step-btns">
              <button className="btn-l" onClick={reCheck}>
                重新检测
              </button>
              <button className="btn-r" onClick={checkOver}>
                结束
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
