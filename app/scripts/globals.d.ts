declare module "vue-codemirror-lite";

import 'react'
declare module 'react' {
    interface InputHTMLAttributes<T> {
        webkitdirectory: string;
    }
}