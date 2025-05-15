'use client'
import React, { useEffect, useRef, useState } from 'react';
import ReactDOM from 'react-dom';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

import { ImageModalProps } from '#/types/ImageGalleryTypes';
// import required modules
import { Pagination } from 'swiper/modules';
import Image from 'next/image';
import InnerImageZoom from 'react-inner-image-zoom'

import { useRouter, useSearchParams } from 'next/navigation';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/pagination';
// import './styles.css';

// import image zoom styles.
import 'react-inner-image-zoom/lib/InnerImageZoom/styles.css'



const ImageModal: React.FC<ImageModalProps> =
  ({
    imgKey,
    imgStringArray,
    setIsOpen,
    isOpen,
    closeModal,
  }) => {

    const modalRoot = document.getElementById('modal-root') || document.body;

    useEffect(() => {
      const originalOverflow = window.getComputedStyle(document.body).overflow;

      if (isOpen) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = originalOverflow;
      }

      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }, [isOpen]);


    console.log(52, useSearchParams().get('imgKey'));

    const modalClasses = isOpen
      ? 'fixed inset-0 flex items-center justify-center z-50'
      : 'hidden';


    return ReactDOM.createPortal(
      <div className={modalClasses}>
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={() => {
            closeModal();
            setIsOpen(false);
          }}
        ></div>
        <div className="bg-white p-6 rounded-md shadow-md z-50" style={{ width: '500px', height: '500px' }}>
          <div className="flex justify-between">
            <div>
              <button
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => {
                  closeModal();
                  setIsOpen(false);
                }}
              >
                Close
              </button>
            </div>
          </div>
          <div className="my-8">
            <p className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >39, Add Gallery Images Here.... {imgKey}</p>
            <p className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >39, Add Meta Tags Here.... {imgKey}</p>
            <Swiper
              slidesPerView={2}
              centeredSlides={true}
              spaceBetween={50}
              pagination={{ type: 'fraction' }}
              grabCursor={true}
              initialSlide={imgKey} // Add this line
              modules={[Pagination]}
              className="mySwiper mb-8"
            >
              {imgStringArray.map((imgUrl, index) => (
                <SwiperSlide onClick={() => { console.log(13); return undefined; }} key={index}>
                  <div className='flex h-full w-full items-center justify-center text-gray-500'>
                    <InnerImageZoom
                      width={500}
                      height={600}
                      src={imgUrl} />
                    <p>Share image as link, here.</p>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

          </div>

        </div>
      </div >,
      modalRoot
    );
  };

export default ImageModal;