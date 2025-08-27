import React, { useEffect, useRef, useState } from 'react';
import './rewardMarquee.scss';
let rewardTimer: any = null;
interface RewardPropsParam {
  ysLiveClient: any;
}
interface rewardInfoParam {
  nick: string;
  reward_amount: number;
}

export default function RewardMarquee(props: RewardPropsParam) {
  const { ysLiveClient } = props;
  const EVENT = ysLiveClient?.EVENT || {};
  const rewardMarqueeList = useRef<rewardInfoParam[]>([]);
  const rewardMarqueeArr = useRef<rewardInfoParam[]>([]);
  const [rewardMarqueeInfo, setRewardMarqueeInfo] = useState<rewardInfoParam>();

  useEffect(() => {
    if (ysLiveClient) {
      ysLiveClient.on(EVENT.TIM_REWARD, onMessageReceived);
    }
    return () => {
      ysLiveClient.off(EVENT.TIM_REWARD, onMessageReceived);
    };
  }, []);

  function rewardMarqueeAni() {
    // console.log('打赏红包动画执行', rewardMarqueeList.current.length)
    if (rewardMarqueeList.current.length > 0) {
      let dom = document.documentElement.getElementsByClassName('marquee')[0];
      // console.log('打赏红包动画执行22', dom)
      dom.classList.add('ani');
      let timer = setTimeout(() => {
        dom.classList.remove('ani');
        clearTimeout(timer);
      }, 5000);
    }
  }
  // 显示红包打赏
  function handleSetShowRewardTimer() {
    // console.log('打赏红包动画')
    if (rewardTimer) return;
    let count = rewardMarqueeArr.current.length;
    if (count > 0) {
      if (!rewardMarqueeList.current.length) {
        const result = rewardMarqueeArr.current.splice(0, 1);
        if (result.length) {
          rewardMarqueeList.current = result;
          const rewardInfo = result[0];
          setRewardMarqueeInfo(rewardInfo);
          // console.log('打赏红包动画6', rewardInfo)
          rewardMarqueeAni();
        }
      }
      rewardTimer = setInterval(() => {
        count = rewardMarqueeArr.current.length;
        // console.log('打赏红包动画3')
        if (count > 0) {
          const newResult = rewardMarqueeArr.current.splice(0, 1);
          if (newResult.length) {
            rewardMarqueeList.current = newResult;
            const newRewardInfo = newResult[0];
            setRewardMarqueeInfo(newRewardInfo);
            // console.log('打赏红包动画5', newRewardInfo)
            rewardMarqueeAni();
          }
        } else {
          // console.log('打赏红包动画4')
          clearInterval(rewardTimer);
          rewardTimer = null;
          rewardMarqueeList.current = [];
        }
      }, 5500);
    }
  }
  // 收到红包推荐 im消息
  function onMessageReceived(item: { data: any; eventCode: string }) {
    let data: any = item.data;
    let quote: { [key: string]: any } = JSON.parse(data.quote || '{}');
    const amount: number = quote.reward_detail?.amount; //金额单位：分
    const rewardItem: rewardInfoParam = {
      nick: data.nick,
      reward_amount: parseFloat(`${amount / 100}`),
    };
    rewardMarqueeArr.current.push(rewardItem);
    // console.log('收到打赏红包2', rewardItem)
    handleSetShowRewardTimer();
  }

  return (
    <div className="reward-container marquee">
      <div className="reward-info">
        <div className="nick">{rewardMarqueeInfo?.nick}</div>
        <div className="reward">赞赏红包{rewardMarqueeInfo?.reward_amount}</div>
      </div>
      <img src="https://feed.youshu.cc/readwith/media/picture/636c9d244e253.png" />
    </div>
  );
}
