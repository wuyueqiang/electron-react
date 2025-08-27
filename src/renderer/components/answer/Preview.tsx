import React, { useEffect, useState } from 'react';
import './preview.scss';

interface PreviewPropsParam {
  data: any;
}

export default function Exam(props: PreviewPropsParam) {
  const { data } = props;

  useEffect(() => {}, [data]);

  return (
    <>
      {data ? (
        <div className="preview-box">
          <div className="question-tag">
            {data.question_type == 1 ? '单选' : '多选'}
          </div>
          {data.question_content &&
            data.question_content.map((item: any) => {
              return (
                <>
                  {item.type == 'text' ? (
                    <p className="question-title">{item.content}</p>
                  ) : null}
                  {item.type == 'image' ? (
                    <img className="question-title-image" src={item.content} />
                  ) : null}
                </>
              );
            })}

          {data.item_content &&
            data.item_content.map((item: any) => {
              return (
                <div
                  className="question-option"
                  key={data.live_exam_question_id + '-' + item.target_number}
                >
                  <p>
                    {item.target_number}. {item.item_content}
                  </p>
                  {item.media &&
                  item.media.type == 'image' &&
                  item.media.media_url ? (
                    <img src={item.media.media_url} alt="" />
                  ) : null}
                </div>
              );
            })}
        </div>
      ) : null}
    </>
  );
}
