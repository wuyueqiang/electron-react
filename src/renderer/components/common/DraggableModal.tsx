import React from 'react';
// @ts-ignore
import Draggable from 'react-draggable';
import { Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons'
import './draggableModal.scss';

interface DraggableModalParam {
    children: any,
    visible: boolean,
    title?: string,
    width?: number,
    height?: number,
    close: ()=>{}
}

export default function DraggableModal(props: DraggableModalParam) {
    const { children, visible, title, width, height, close } = props

    let _width: number | string = width || 640;
    let _height: number | string = height || 360;

    let bodyW = document.documentElement.clientWidth;
    let bodyH = document.documentElement.clientHeight;

    let defaultPosition = {
        x: (bodyW - _width) / 2,
        y: (bodyH - _height) / 2
    }

    return (
        <div className={visible ? "draggable-box visible" : "draggable-box"}>
            <Draggable
                axis="both"
                bounds="body"
                handle=".draggable-handle"
                defaultPosition={defaultPosition}
                position={null}
                scale={1}
            >
                <div className="draggable-wrap" style={{width: _width, height: _height}}>
                    <div className="draggable-handle">
                        <p>{title}</p>
                        <Button type="text" className="no-cursor" onClick={close}>
                            <CloseOutlined />
                        </Button>
                    </div>
                    <div className="draggable-content">
                        {children}
                    </div>
                </div>
            </Draggable>
        </div>
    )
}
