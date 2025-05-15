import { CurrentRoute } from '#/app/parallel-routes/_ui/current-route';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';


export const echoCurrentURL = () => {

    console.log(52, useSearchParams().get('imgKey'));
    console.log(52.7, useSearchParams().toString());
    const pathname = usePathname();
    console.log(52.8, pathname);

    // console.log(52.8, CurrentRoute());

}
