import React, { useEffect, useRef, useState } from 'react';
import './pendant.scss';
import { message as Message, Carousel } from 'antd';
import { setValue } from '../reducers/roomConfigSlice';
import { useDispatch, useSelector } from 'react-redux';
import { selectRoomConfig } from '../reducers/index';
// import Swiper from 'react-id-swiper';
let hotSaleTimer: any = null;
let labelTimer: any = null;
let lotteryTimer: any = null;
let depositTimer: any = null;
let initData: any = {
  text: '',
  second: 0,
  prize_img: '',
};
interface PendantPropsParam {
  ysLiveClient: any;
  lotteryTask: any;
}
interface PendantGoodObj {
  [key: string]: any;
}
interface hotConfig {
  base_nums: number;
  min_nums: number;
  duration: number;
}
export default function Pendant(props: PendantPropsParam) {
  const dispatch = useDispatch();
  const roomConfig = useSelector(selectRoomConfig);
  const hotSaleStatus: number | string = 1;
  const [showPendantGood, setShowPendantGood] = useState<Boolean>(false);
  let showPendantGoodRef = useRef<boolean>();
  const [pendantGood, setPendantGood] = useState<PendantGoodObj>({});
  let pendantGoodRef = useRef<PendantGoodObj>();

  const [showPendantCoupon, setShowPendantCoupon] = useState<Boolean>(false);
  let showPendantCouponRef = useRef<boolean>();
  const [pendantCoupon, setPendantCoupon] = useState<PendantGoodObj>({});
  let pendantCouponRef = useRef<PendantGoodObj>();

  const { ysLiveClient, lotteryTask } = props;
  const { isLotterying } = roomConfig;
  const [lotteryState, setLotteryState] = useState(initData);
  let lotteryRef = useRef(initData);

  const EVENT = ysLiveClient?.EVENT || {};

  // 热卖名额剩余数量 计算
  function getSurplusNums(data: PendantGoodObj) {
    const newTs = Math.ceil(new Date().getTime() / 1000);
    const dataConfig: hotConfig = data.hot_config;
    const durationX =
      newTs - (data.hot_start_time || 0) < 0
        ? 0
        : newTs - (data.hot_start_time || 0);
    // 减速运动
    const x = dataConfig.base_nums - dataConfig.min_nums;
    const a = -(2 * x) / (dataConfig.duration * dataConfig.duration);
    const v0 = Math.sqrt(-2 * a * x);
    let difference = v0 * durationX + (1 / 2) * a * durationX * durationX;
    return {
      hot_status: durationX > dataConfig.duration ? 2 : hotSaleStatus,
      surplus_nums:
        durationX == 0
          ? dataConfig.base_nums
          : durationX > dataConfig.duration
            ? 0
            : Math.floor(dataConfig.base_nums - difference),
    };
  }
  // 热卖名额剩余数量 定时器
  function handleHotSaleTimer() {
    hotSaleTimer = setInterval(() => {
      // 剩余热卖名额 算法
      // 挂件
      if ((pendantGoodRef.current || {}).hot_status == hotSaleStatus) {
        const otherNowRecGoodDataObj = getSurplusNums(
          pendantGoodRef.current || {},
        );
        const newPendantGood = {
          ...(pendantGoodRef.current || {}),
          ...otherNowRecGoodDataObj,
        };
        setPendantGood(newPendantGood);
        pendantGoodRef.current = newPendantGood;
      } else {
        clearInterval(hotSaleTimer);
      }
    }, 5000);
  }
  // 订金展示定时器
  function handleDepositTimer() {
    const newPendantGood = {
      ...(pendantGoodRef.current || {}),
      showDeposit: getShowDeposit(
        pendantGoodRef.current?.is_open_deposit
          ? pendantGoodRef.current.deposit
          : false,
      ),
    };
    setPendantGood(newPendantGood);
    pendantGoodRef.current = newPendantGood;

    depositTimer = setInterval(() => {
      const newPendantGood = {
        ...(pendantGoodRef.current || {}),
        showDeposit: getShowDeposit(
          pendantGoodRef.current?.is_open_deposit
            ? pendantGoodRef.current.deposit
            : false,
        ),
      };
      setPendantGood(newPendantGood);
      pendantGoodRef.current = newPendantGood;

      // console.log('===pendantGoodRef.current', pendantGoodRef.current)
    }, 1000);
  }

  // 获取订金展示状态
  function getShowDeposit(deposit: any) {
    if (!deposit) {
      return false;
    }
    let now = new Date().getTime();
    let start_time = deposit.start_time * 1000;
    let end_time = deposit.end_time * 1000;
    if (start_time < now && end_time > now) {
      return true;
    } else {
      return false;
    }
  }

  // 优惠券领取计时器
  function startLabelTimer() {
    freshLabel();
    if (labelTimer) {
      return;
    }
    labelTimer = setInterval(() => {
      freshLabel();
    }, 1000);
  }
  // 刷新时间
  function freshLabel() {
    if (!showPendantCouponRef.current) {
      clearInterval(labelTimer);
      labelTimer = null;
    }

    let couponData = JSON.parse(JSON.stringify(pendantCouponRef.current));
    let now = new Date().getTime();
    let gets = couponData.coupon_end_time * 1000 - now;
    if (gets <= 0) {
      // 已过期,隐藏
      couponData = {};
      setShowPendantCoupon(false);
      showPendantCouponRef.current = false;
    } else {
      if (couponData.coupon_active_days > 0) {
        couponData.time_label = couponData.coupon_active_days + '天后失效';
      } else {
        let uses = couponData.coupon_active_end_time * 1000 - now;
        if (uses <= 0) {
          // 已失效
          couponData = {};
          setShowPendantCoupon(false);
          showPendantCouponRef.current = false;
        } else {
          // 未失效
          if (uses > 1 * 24 * 60 * 60 * 1000) {
            // 大与1天，显示x天后失效
            couponData.time_label = `${Math.floor(uses / (24 * 60 * 60 * 1000))}天后失效`;
          } else {
            // 小于1天，显示倒计时hh：mm：ss后失效
            couponData.time_label = getTimeLabel(uses);
          }
        }
      }
    }
    setPendantCoupon(couponData);
    pendantCouponRef.current = couponData;
  }
  function toTwo(n: number | string) {
    return (n = Number(n) > 9 ? '' + n : '0' + n);
  }
  // 获取倒计时str
  function getTimeLabel(_ts: number) {
    let label = {
      d: '',
      h: '',
      m: '',
      s: '',
    };
    function setMyTime() {
      label.d = '' + Math.floor(_ts / 1000 / 60 / 60 / 24);
      label.h = '' + Math.floor((_ts / 1000 / 60 / 60) % 24);
      label.m = '' + Math.floor((_ts / 1000 / 60) % 60);
      label.s = '' + Math.floor((_ts / 1000) % 60);
      label.d = toTwo(label.d);
      label.h = toTwo(label.h);
      label.m = toTwo(label.m);
      label.s = toTwo(label.s);
    }
    setMyTime();
    return `${label.h}:${label.m}:${label.s}<br/>后失效`;
  }
  // 检查抽奖时间并开始
  function checkLotteryTime() {
    if (lotteryTask && lotteryTask.draw_interval > 0) {
      setLotteryState({
        text: '',
        second: lotteryTask.draw_interval,
        prize_img: lotteryTask.prize_img,
      });
      lotteryRef.current = {
        text: '',
        second: lotteryTask.draw_interval,
        prize_img: lotteryTask.prize_img,
      };
      startLotteryTimer();
      lotteryTimer = setInterval(() => {
        startLotteryTimer();
      }, 1000);
    } else {
      lotteryTimer && clearInterval(lotteryTimer);
      setLotteryState(initData);
      lotteryRef.current = initData;
    }
  }
  // 开始抽奖倒计时
  function startLotteryTimer() {
    if (lotteryRef.current) {
      if (lotteryRef.current.second <= 0) {
        clearInterval(lotteryTimer);
        lotteryTimer = null;
        let data = {
          ...lotteryRef.current,
          text: '00:00',
        };
        setLotteryState(data);
        lotteryRef.current = data;
        dispatch(setValue({ key: 'isLotterying', value: false }));
        return;
      }
      let data = lotteryRef.current;
      let m = toTwo(Math.floor(data.second / 60));
      let s = toTwo(Math.floor(data.second % 60));
      let newData = {
        ...data,
        text: `${m}:${s}`,
        second: data.second - 1,
      };
      setLotteryState(newData);
      lotteryRef.current = newData;
    }
  }

  function clickLottery() {
    Message.info('活动中，未到开奖时间');
  }

  useEffect(() => {
    if (ysLiveClient) {
      ysLiveClient.on(EVENT.TIM_PENDANT, onMessageReceived);
    }
    return () => {
      ysLiveClient.off(EVENT.TIM_PENDANT, onMessageReceived);
      hotSaleTimer && clearInterval(hotSaleTimer);
      labelTimer && clearInterval(labelTimer);
      lotteryTimer && clearInterval(lotteryTimer);
      depositTimer && clearInterval(depositTimer);
      setLotteryState(initData);
      lotteryRef.current = initData;
    };
  }, []);

  useEffect(() => {
    if (isLotterying) {
      checkLotteryTime();
    } else {
      lotteryTimer && clearInterval(lotteryTimer);
      setLotteryState({
        text: '',
        second: 0,
        prize_img: '',
      });
      lotteryRef.current = {
        text: '',
        second: 0,
        prize_img: '',
      };
    }
  }, [isLotterying]);

  // 收到挂件推荐 im消息
  function onMessageReceived(item: { data: any; eventCode: string }) {
    let data: any = item.data;
    if (data.type == 'liveSystemMsg') {
      if (
        [
          'liveSpreadRecommend',
          'liveSpreadYouzanRecommend',
          'liveCancelSpreadRecommend',
          'setLiveHotConfig',
          'liveCouponRecommend',
          'liveCancelCouponRecommend',
        ].includes(data.action)
      ) {
        let quote: PendantGoodObj = JSON.parse(data.quote || '{}');
        let otherNowRecGoodDataObj: PendantGoodObj = {};

        if (quote.hot_status == hotSaleStatus) {
          otherNowRecGoodDataObj = getSurplusNums(quote);
        }
        if (
          ['liveSpreadRecommend', 'liveSpreadYouzanRecommend'].includes(
            data.action,
          ) &&
          !quote.spread_type
        ) {
          const newPendantGoodRecommend = {
            ...quote,
            surplus_nums: otherNowRecGoodDataObj.surplus_nums,
          };
          setPendantGood(newPendantGoodRecommend);
          pendantGoodRef.current = newPendantGoodRecommend;
          setShowPendantGood(true);
          showPendantGoodRef.current = true;
          if (quote.hot_status == hotSaleStatus) {
            handleHotSaleTimer();
          } else {
            clearInterval(hotSaleTimer);
          }
          if (quote.is_open_deposit) {
            handleDepositTimer();
          } else {
            clearInterval(depositTimer);
          }
        } else if (data.action == 'liveCancelSpreadRecommend') {
          if (!showPendantGoodRef.current) return;
          clearInterval(hotSaleTimer);
          clearInterval(depositTimer);

          setPendantGood({});
          pendantGoodRef.current = {};

          setShowPendantGood(false);
          showPendantGoodRef.current = false;
        } else if (data.action == 'setLiveHotConfig') {
          if (
            quote.live_spread_id ==
              (pendantGoodRef.current || {}).live_spread_id &&
            showPendantGoodRef.current
          ) {
            const newPendantGood = {
              ...pendantGoodRef.current,
              ...quote,
              ...otherNowRecGoodDataObj,
            };
            setPendantGood(newPendantGood);
            pendantGoodRef.current = newPendantGood;
            if (quote.hot_status == hotSaleStatus) {
              handleHotSaleTimer();
            } else {
              clearInterval(hotSaleTimer);
            }
          }
        } else if (data.action == 'liveCouponRecommend') {
          // 设为优惠券挂件
          if (quote.type == 2) {
            console.log('设为优惠券挂件');
            const newPendantCoupomRecommend = {
              ...quote,
              time_label: '',
            };
            setPendantCoupon(newPendantCoupomRecommend);
            pendantCouponRef.current = newPendantCoupomRecommend;
            setShowPendantCoupon(true);
            showPendantCouponRef.current = true;
            startLabelTimer();
          }
        } else if (data.action == 'liveCancelCouponRecommend') {
          // 取消优惠券挂件
          console.log('取消优惠券挂件');
          setPendantCoupon({});
          pendantCouponRef.current = {};
          setShowPendantCoupon(false);
          showPendantCouponRef.current = false;
        }
      }
    }
  }

  // 挂件拖拽
  function dragFunc(e: any) {
    let dragParentBox: HTMLElement | null =
      document.getElementById('room-wrap');
    let dragBox: HTMLElement | null = document.getElementById('dragBox');
    let et = e || window.event;
    /*用于保存小的div拖拽前的坐标*/
    if (!dragBox || !dragParentBox) return;
    let diffX = et.clientX - dragBox.offsetLeft;
    let diffY = et.clientY - dragBox.offsetTop;
    let offsetHeight = dragBox.offsetHeight;
    let innerHeight = dragParentBox.clientHeight;
    let innerWidth = dragParentBox.clientWidth;
    e.preventDefault();
    /*鼠标的移动事件*/
    document.onmousemove = function (e) {
      if (!dragBox) return;
      let et = e || window.event;
      let currentX = et.clientX;
      let currentY = et.clientY;
      let my = currentY - diffY;
      let mx = currentX - diffX;
      let top, left;
      if (mx < 0) {
        left = 0;
      } else if (mx > innerWidth - 110) {
        left = innerWidth - 110;
      } else {
        left = mx;
      }
      if (my < 0) {
        top = 0;
      } else if (my > innerHeight - offsetHeight) {
        top = innerHeight - offsetHeight;
      } else {
        top = my;
      }
      dragBox.style.top = `${top}px`;
      dragBox.style.right = `${innerWidth - left - 92}px`;
    };
    /*鼠标的抬起事件,终止拖动*/
    document.onmouseup = function () {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  }

  return (
    <div>
      {showPendantGood || showPendantCoupon || isLotterying ? (
        <div
          className="pendant-box"
          id="dragBox"
          onMouseDown={(e) => dragFunc(e)}
        >
          {isLotterying ? (
            <div className="lottery" onClick={() => clickLottery()}>
              <img
                className="lottery-icon"
                src="https://feed.youshu.cc/readwith/media/0/1699588196428.png"
              />
              <p className="lottery-text">{lotteryState.text}</p>
              <div
                className="prize-box"
                style={{ backgroundImage: `url(${lotteryState.prize_img})` }}
              ></div>
            </div>
          ) : null}
          {showPendantGood || showPendantCoupon ? (
            <Carousel dots={false} autoplay>
              {showPendantGood ? (
                <div>
                  {pendantGood.hot_status == 1 ? (
                    <div className="hot-nums-box">
                      <div className="hot-nums">
                        <img
                          src="http://feed.youshu.cc/readwith/media/picture/63185a5401a03.png"
                          alt=""
                          width="10"
                        />
                        剩
                        <span className="nums">{pendantGood.surplus_nums}</span>
                        名额
                      </div>
                    </div>
                  ) : null}
                  <div className="recommend">
                    <div
                      className="tieBox"
                      onClick={() => {
                        Message.error('老师端暂不支持购买商品');
                      }}
                    >
                      <div
                        className="tieCover"
                        style={{
                          backgroundImage: `url(${pendantGood.spread_img})`,
                        }}
                      ></div>
                      <div className="tieName">
                        {pendantGood.spread_goods_title}
                      </div>
                      {pendantGood.is_open_deposit &&
                      pendantGood.showDeposit ? (
                        <div className="tiePrice">
                          订金¥{pendantGood.deposit_price}
                        </div>
                      ) : (
                        <div className="tiePrice">
                          ¥{pendantGood.spread_goods_price}{' '}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
              {showPendantCoupon ? (
                <div>
                  <div className="coupon">
                    <div className="coupon-top">
                      {pendantCoupon.coupon_type == 30 ? (
                        <p className="all-title">
                          全额
                          <br />
                          兑换券
                        </p>
                      ) : (
                        <div>
                          <p className="price">
                            ¥{pendantCoupon.coupon_discount}
                          </p>
                          <p className="price-title">优惠券</p>
                        </div>
                      )}
                    </div>
                    <div className="coupon-bottom">
                      {pendantCoupon.coupon_use_status == 1 ? (
                        <p
                          dangerouslySetInnerHTML={{
                            __html: pendantCoupon.time_label,
                          }}
                        ></p>
                      ) : (
                        <p className="over">已过期</p>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </Carousel>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
