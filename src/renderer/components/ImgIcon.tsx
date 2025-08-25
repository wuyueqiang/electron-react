import React from 'react'
import Icon  from '@ant-design/icons';
import IMGS from '../imgs';

function createIconDom(src: any, name: string) {
    return () => (
        <img src={src} className={`imgicon ${name}`} alt="imgicon"/>
    )
}

const IconDoms = {
    Pen: createIconDom(IMGS.PEN_ICON, 'pen'),
    PenClick: createIconDom(IMGS.PEN_ICON_CLICK, 'penclick'),
    Rectangle: createIconDom(IMGS.JUXING_ICON, 'rectangle'),
    RectangleClick: createIconDom(IMGS.JUXING_ICON_CLICK, 'rectangleclick'),
    Camera: createIconDom(IMGS.CAMERA_ICON, 'camera'),
    CameraClick: createIconDom(IMGS.CAMERA_ICON_CLICK, 'cameraclick'),
    CameraClose: createIconDom(IMGS.CAMERA_ICON_CLOSE, 'cameraclose'),
    Circle: createIconDom(IMGS.YUAN_ICON, 'circle'),
    CircleClick: createIconDom(IMGS.YUAN_ICON_CLICK, 'circleclick'),
    Earser: createIconDom(IMGS.ERASER_ICON, 'earser'),
    EarserClick: createIconDom(IMGS.ERASER_ICON_CLICK, 'earserclick'),
    Text: createIconDom(IMGS.TEXT_ICON, 'text'),
    TextClick: createIconDom(IMGS.TEXT_ICON_CLICK, 'textclick'),
    Clean: createIconDom(IMGS.CLEAN_ICON, 'clean'),
    CleanClick: createIconDom(IMGS.CLEAN_ICON_CLICK, 'cleanclick'),
    Undo: createIconDom(IMGS.LASTSTEP_ICON, 'undo'),
    UndoClick: createIconDom(IMGS.LASTSTEP_ICON_CLICK, 'cudoclick'),
    Redo: createIconDom(IMGS.NEXTSTEP_ICON, 'redo'),
    RedoClick: createIconDom(IMGS.NEXTSTEP_ICON_CLICK, 'redoclick'),
    Big: createIconDom(IMGS.BIG_ICON, 'big'),
    BigClick: createIconDom(IMGS.BIG_ICON_CLICK, 'bigclick'),
    Middle: createIconDom(IMGS.MIDDLE_ICON, 'middle'),
    MiddleClick: createIconDom(IMGS.MIDDLE_ICON_CLICK, 'middleclick'),
    Small: createIconDom(IMGS.SMALL_ICON, 'small'),
    SmallClick: createIconDom(IMGS.SMALL_ICON_CLICK, 'smallclick'),
    Move: createIconDom(IMGS.MOVE_ICON, 'move'),
    MoveClick: createIconDom(IMGS.MOVE_ICON_CLICK, 'moveclick'),
    Last: createIconDom(IMGS.LAST_ICON, 'last'),
    Next: createIconDom(IMGS.NEXT_ICON, 'next'),
    Speaker: createIconDom(IMGS.SPEAKER_ICON, 'speaker'),
    SpeakerClick: createIconDom(IMGS.SPEAKER_ICON_CLICK, 'speakerclick'),
    SpeakerClose: createIconDom(IMGS.SPEAKER_ICON_CLOSE, 'speakerclose'),
    Kejian: createIconDom(IMGS.KEJIAN_ICON, 'kejian'),
    Mic: createIconDom(IMGS.MIC_ICON, 'mic'),
    MicClick: createIconDom(IMGS.MIC_ICON_CLICK, 'micclick'),
    MicClose: createIconDom(IMGS.MIC_ICON_CLOSE, 'micclose'),
    Test: createIconDom(IMGS.TEST_ICON, 'test'),
    ShareScreen: createIconDom(IMGS.SHARE_SCREEN, 'sharescreen'),
    TestClick: createIconDom(IMGS.TEST_ICON_CLICK, 'testclick'),
    Sanjiao: createIconDom(IMGS.SANJIAO_UP_ICON, 'sanjiao'),
    Desktop: createIconDom(IMGS.DESKTOP_ICON, 'desktop'),
    DesktopClick: createIconDom(IMGS.DESKTOP_ICON_CLICK, 'desktopclick'),
    CameraTest: createIconDom(IMGS.CAMERA_TEST_ICON, 'cameratest'),
    CameraTestC: createIconDom(IMGS.CAMERA_TEST_C_ICON, 'cameratestc'),
    CeshiLink: createIconDom(IMGS.CESHI_LINK_ICON, 'ceshilink'),
    MicTestC: createIconDom(IMGS.MIC_TEST_C_ICON, 'mictestc'),
    MicTest: createIconDom(IMGS.MIC_TEST_ICON, 'mictest'),
    SpeakerTestC: createIconDom(IMGS.SPEAKER_TEST_C_ICON, 'speakertestc'),
    SpeakerTest: createIconDom(IMGS.SPEAKER_TEST_ICON, 'speakertest'),
    WifiTest: createIconDom(IMGS.WIFI_TEST_ICON, 'wifitest'),
    WifiTestC: createIconDom(IMGS.WIFI_TEST_C_ICON, 'wifitestc'),
    DeviceTest: createIconDom(IMGS.DEVICE_TEST_ICON, 'devicetest'),
    DeviceTestC: createIconDom(IMGS.DEVICE_TEST_C_ICON, 'devicetestc'),
    Succeed: createIconDom(IMGS.SUCCEED_ICON, 'succeed'),
    TestCamera: createIconDom(IMGS.TEST_CAMERA, 'testcamera'),
    TestSpeaker: createIconDom(IMGS.TEST_SPEAKER, 'testspeaker'),
    TestMic: createIconDom(IMGS.TEST_MIC, 'testmic'),
    TestCPU: createIconDom(IMGS.TEST_CPU, 'testcpu'),
    TestWifi: createIconDom(IMGS.TEST_WIFI, 'testwifi'),
    Failed: createIconDom(IMGS.DEFEATED_ICON, 'failed'),
    Exit: createIconDom(IMGS.EXIT_ICON, 'exit'),
    ExitClick: createIconDom(IMGS.EXIT_ICON_CLICK, 'exitclick'),
    Xiake: createIconDom(IMGS.XIAKE_ICON, 'xiake'),
    Uploadpic: createIconDom(IMGS.UPLOADPIC_ICON, 'uploadpic'),
    MirrorLeft: createIconDom(IMGS.MIRROR_LEFT_ICON, 'mirrorleft'),
    MirrorRight: createIconDom(IMGS.MIRROR_RIGHT_ICON, 'mirrorright'),
    LeftTop: createIconDom(IMGS.LEFT_TOP_ICON, 'leftTop'),
    LeftBottom: createIconDom(IMGS.LEFT_BOTTOM_ICON, 'leftBottom'),
    RightBottom: createIconDom(IMGS.RIGHT_BOTTOM_ICON, 'rightBottom'),
    RightTop: createIconDom(IMGS.RIGHT_TOP_ICON, 'rightTop'),
    WhiteLeftTop: createIconDom(IMGS.WHITE_LEFT_TOP_ICON, 'whiteLeftTop'),
    WhiteLeftBottom: createIconDom(IMGS.WHITE_LEFT_BOTTOM_ICON, 'whiteLeftBottom'),
    WhiteRightBottom: createIconDom(IMGS.WHITE_RIGHT_BOTTOM_ICON, 'whiteRightBottom'),
    WhiteRightTop: createIconDom(IMGS.WHITE_RIGHT_TOP_ICON, 'whiteRightTop'),
    FullScreen: createIconDom(IMGS.FULLSCREEN, 'fullScreen'),
    CancelFullScreen: createIconDom(IMGS.CANCEL_FULLSCREEN, 'cancelFullScreen'),
    Digg: createIconDom(IMGS.Digg, 'digg'),
    Answer: createIconDom(IMGS.ANSWER, 'answer'),
    AnswerClick: createIconDom(IMGS.ANSWER_CLICK, 'answerclick'),
    Chat: createIconDom(IMGS.CHAT, 'chat'),
    Lottery: createIconDom(IMGS.LOTTERY, 'lottery'),
    MusicPlay: createIconDom(IMGS.MUSICPLAY, 'musicPlay'),
    MusicPause: createIconDom(IMGS.MUSICPAUSE, 'musicPause'),
    MusicLoop: createIconDom(IMGS.MUSICLOOP, 'musicLoop'),
    MusicNoLoop: createIconDom(IMGS.MUSICNOLOOP, 'musicNoLoop'),
    MusicQuit: createIconDom(IMGS.MUSICQUIT, 'musicQuit'),
    MusicVolume: createIconDom(IMGS.MUSICVOLUME, 'musicVolume'),
}

const ImgIcon: any = {};

Object.keys(IconDoms).map(item => {
    // @ts-ignore
    ImgIcon[item] = props => <Icon component={() => IconDoms[item](props)} {...props} />
})


export default ImgIcon;



