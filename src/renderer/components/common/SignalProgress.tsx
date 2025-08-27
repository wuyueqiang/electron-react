import React from 'react'

export default function SignalProgress(props: any) {
    const {step = 5, bgColor = '', value = 0, style, className = 'signal-progress'} = props;

    const list: any = [];

    for(let i = 0;i < step;i++) {
        list.push(i)
    }

    const styles = {
        ul: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            width: '19px',
            height: '20px',
            ...style
        }
    }

    function getHeight(index: number) {
        let i = index + 1;
        let per = 100 / step;
        return i * per + '%';
    }

    function getBgColor(index: number) {

        if (value == 1 && index == 0) {
            return hexToRgba(bgColor || '#FF4848', 1)
        } else if ((value == 2 || value == 3) && value >= index +1) {
            return hexToRgba(bgColor || '#F7B500', 1)
        } else if ((value == 4 || value == 5) && value >= index +1) {
            return hexToRgba(bgColor || '#2BAF6A', 1)
        } else {
            return hexToRgba(bgColor || '#000000', .3)
        }

    }

    function hexToRgba(hex: any, opacity: number) {
        return "rgba(" + parseInt("0x" + hex.slice(1, 3)) + "," + parseInt("0x" + hex.slice(3, 5)) + "," + parseInt("0x" + hex.slice(5, 7)) + "," + opacity + ")";
    }

    return (
        <div style={styles.ul} className={className}>
            {
                list.map((index: number) => {
                    return <div key={index} style={{
                        width: '3px',
                        height: getHeight(index),
                        background: getBgColor(index),
                        borderRadius: '2px',
                    }}></div>
                })
            }
        </div>
    )
}
