import React, { useRef, useState } from 'react';
// Import Swiper React components
import { Swiper, SwiperSlide } from 'swiper/react';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/effect-cube';
import 'swiper/css/pagination';

import ImageModal from './image-modal';

// import './styles.css';

// import required modules
import { Pagination } from 'swiper/modules';
import { useRouter } from 'next/navigation';
import { is } from 'date-fns/locale';

interface ImageStringProps {
    imgStringArray: string[];
}

// Add a string as a parameter to the function below.
export const ImageString: React.FC<ImageStringProps> = ({ imgStringArray }) => {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [imgKeyNum, setImgKeyNum] = useState<number | null>(null);
    const router = useRouter();

    const closeModal = () => {
        setModalIsOpen(false);
    };
    const openModalGallery = (imgKey: number) => {

        setImgKeyNum(imgKey);
        setModalIsOpen(true);
        // This is very slow:
        // router.push(`?imgKey=${imgKey}`);
        // This is faster:
        window.history.pushState(null, '', `?imgKey=${imgKey}?modal=${modalIsOpen}`);
        console.log(37, imgKey);
        // Gotta add swiper just for the day which it was clicked on here.


    }


    return (
        <>
            <Swiper
                slidesPerView={3}
                spaceBetween={10}
                pagination={{
                    clickable: true,
                }}
                breakpoints={{
                    640: {
                        slidesPerView: 2,
                        spaceBetween: 20,
                    },
                    768: {
                        slidesPerView: 4,
                        spaceBetween: 40,
                    },
                    1024: {
                        slidesPerView: 5,
                        spaceBetween: 50,
                    },
                }}
                modules={[Pagination]}
                className="mySwiper"
            >
                <>
                    {imgStringArray.map((imgUrl, index) => (
                        <SwiperSlide onClick={() => { console.log(13); return undefined; }} key={index}>
                            <img onClick={() => { openModalGallery(index); return undefined; }} src={imgUrl} />
                        </SwiperSlide>
                    ))}
                </>


            </Swiper>

            {modalIsOpen && (

                //  I could have workTimeTop up here and then just watch for 
                //  a change in workTimeEmployee and then just change the whole of
                //  work time top.


                // Have to pass all of the images into the ImageModal but larger within the ImageModal
                <ImageModal
                    imgKey={imgKeyNum as number}
                    imgStringArray={imgStringArray}
                    setIsOpen={setModalIsOpen}
                    // employeeName={selectedEmployeeName}
                    // employeeID={selectedEmployeeID}
                    isOpen={modalIsOpen}
                    closeModal={closeModal} />
            )}


        </>


    );
}



