# ts-transformer-preval

**NOT STABLE, consider that when using it**

Pre-evaluate code at build-time.

Inspired by [babel-plugin-preval](https://github.com/kentcdodds/babel-plugin-preval) & forced by the behaviour of
[next.js](http://nextjs.org/) _(in detail the `getInitialProps` function on client side)_.

This small transformer came to live.

## The problem

> You need to do some dynamic stuff, but don't want to do it at runtime. Or maybe you want to do stuff like read the filesystem to get a list of files and you can't do that in the browser.

_[babel-plugin-preval#the-problem](https://github.com/kentcdodds/babel-plugin-preval#the-problem)_

## The solution

This allows you to specify some code that gets transpiled, runs in Node and whatever
your `run` function returns in there will be swapped. For example:

```typescript
import { preval } from 'ts-transformer-preval-macro';

const data = preval`function run() {
   return 5+5; 
}`;
```

becomes

```typescript
const data = 10;
```

Something more fancy?

```typescript
import IContentBlock from '../interfaces/IContentBlock';
import { preval } from 'ts-transformer-preval-macro';

const content: IContentBlock[] = preval`
import {FetchData, getContentPiece} from '../services/DataService';
import IContentBlock from '../interfaces/IContentBlock';

async function run() {
    const fetcher = new FetchtData();

    const contentBlocks: IContentBlock[] = getContentPiece<IContentBlock>(
        await fetcher.getContentBlocks({
            'fields.identifier[match]': 'article.'
        })
    );

    return contentBlocks;
}`;
```

becomes

```typescript
import IContentBlock from '../interfaces/IContentBlock';

const content: IContentBlock[] = [
  {
    identifier: 'article.typescript.transformer.preval',
    title: 'How to write a typescript transformer',
    content: '...',
    slug: 'howto-write-a-typescript-transformer'
  },
  {
    identifier: 'article.typescript.transformer.101',
    title: 'Typescript transformer 101',
    content: '...',
    slug: 'typescript-transformer-101'
  }
];
```

## Install

`npm i ts-transformer-preval-macro`

## Configuration

### mode

type: `string`<br />
default: `development`<br />

Switch basic settings between `production` and `development`.

### cacheActivated

type: `boolean`<br />
default: `false`<br />

If activated results of pre-evaluation will be cached until code is changed.
`production` and `development` mode have separated caches.

## Usage

### With loaders

#### With ts-loader

#### With atl

#### With tsc

## Contribute

1. Don´t harvest any data ¯\\\_(ツ)\_/¯
2. Git flow
3. Make sure to execute the pre-commit hook `ln -sf ../../.dx/hooks/pre-commit .git/hooks/pre-commit`
4. Write tests

## Inspired by

[kentcdodds](https://github.com/kentcdodds) awesome [babel-plugin-preval](https://github.com/kentcdodds/babel-plugin-preval).

## LICENSE

MIT
