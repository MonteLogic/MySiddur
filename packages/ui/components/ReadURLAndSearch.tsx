'use client';

import { usePathname, useSearchParams } from 'next/navigation';


export const echoCurrentURL = () => {

    console.log(52, useSearchParams().get('imgKey'));
    console.log(52.7, useSearchParams().toString());
    const pathname = usePathname();
    console.log(52.8, pathname);

    // console.log(52.8, CurrentRoute());

}
