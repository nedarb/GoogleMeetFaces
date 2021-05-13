import React, { useEffect, useState } from "react";
import { drawText } from "../../contentScript/textVideoStream";

enum KEYS {
  IMAGE_URL = "debug:imageUrl",
  TEXT = "debug:text",
}

export default function Debug() {
  const [imageUrl, setImageUrl] = useState<string>(
    localStorage.getItem(KEYS.IMAGE_URL)
  );
  const [text, setText] = useState<string>(
    localStorage.getItem(KEYS.TEXT) || "foobar"
  );

  useEffect(() => {
    localStorage.setItem(KEYS.TEXT, text);
    localStorage.setItem(KEYS.IMAGE_URL, imageUrl);

    drawText(text, {
      image: imageUrl,
    });
  }, [imageUrl, text]);

  const urlChange = (e) => {
    const updatedValue = e.target.value;
    setImageUrl(updatedValue);
  };

  const textChange = (e) => {
    const updatedValue = e.target.value;
    setText(updatedValue);
  };

  return (
    <div className="popupContainer">
      <div>
        Text:
        <input
          type="text"
          value={text}
          onChange={textChange}
          placeholder="foobar"
        />
      </div>
      <div>
        Image:
        <input type="text" value={imageUrl} onChange={urlChange} />
      </div>
    </div>
  );
}
