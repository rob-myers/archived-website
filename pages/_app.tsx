import App, { AppInitialProps } from 'next/app';
import { Provider } from 'react-redux';
import { Persistor, persistStore } from 'redux-persist';
import { PersistGate } from 'redux-persist/integration/react';
import React from 'react';
import { NextComponentType, NextPageContext } from 'next';
import { Router } from 'next/dist/client/router';
import Head from 'next/head';
import { ToastProvider } from 'react-toast-notifications';
import { ReduxStore } from '@store/create-store';
import withRedux from '@store/with-redux';

import 'xterm/css/xterm.css';
import './global.scss';

interface Props {
  reduxStore: ReduxStore;
}

class MyApp extends App<Props> {
  private persistor: Persistor;

  constructor(
    props: Props & AppInitialProps & {
      Component: NextComponentType<NextPageContext, any, {}>;
      router: Router;
    }
  ) {
    super(props);
    this.persistor = persistStore(props.reduxStore);
  }

  public render() {
    const { Component, pageProps, reduxStore } = this.props;
    return (
      <Provider store={reduxStore}>
        <PersistGate persistor={this.persistor}>
          <ToastProvider>
            <Head>
              <link rel="shortcut icon" href="/favicon.ico" />
            </Head>
            <Component {...pageProps} />
          </ToastProvider>
        </PersistGate>
      </Provider>
    );
  }
}

export default withRedux(MyApp as any);
