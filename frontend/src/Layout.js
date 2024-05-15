import React from 'react';
import Navigation from './Navigation';
import Footer from './Footer';

const Layout = ({ children }) => {
    return (
        <>
            <Navigation />
            <div class>{children}</div>
            <Footer />
        </>
    );
};

export default Layout;
