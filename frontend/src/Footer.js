import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

const Footer = () => {
    return (
        <footer id="main-footer " className="container mt-5 bg-light">
            <div className="row">
                <div className="col-md-3 d-flex flex-column">
                    <h2><a href="#" target="_blank">DuraTasks</a></h2>
                    <ul className="list-unstyled">
                        <li><a href="#" target="_blank">Contact Us</a></li>
                        <li><a href="#" target="_blank">Get Support</a></li>
                        <li><a href="#" target="_blank">How It Works</a></li>
                        <li><a href="#" target="_blank">Privacy Notice</a></li>
                        <li> <a href="#" target="_blank">Releases</a></li>
                    </ul>
                </div>
                <div className="col-md-3 d-flex flex-column">
                    <h2><a href="#" target="_blank">Community</a></h2>
                    <ul className="list-unstyled">
                        <li><a href="#">Join Community</a></li>
                        <li><a href="#" target="_blank">Vote and Comment</a></li>
                        <li><a href="#" target="_blank">Contributors</a></li>
                        <li><a href="#">Top Users</a></li>
                        <li><a href="#">Community Buzz</a></li>
                    </ul>
                </div>
                <div className="col-md-3 d-flex flex-column">
                    <h2><a href="#" target="_blank">Tools</a></h2>
                    <ul className="list-unstyled">
                        <li><a href="#" target="_blank">API Scripts</a></li>
                        <li><a href="#" target="_blank">Desktop Apps</a></li>
                        <li><a href="#" target="_blank">Mobile App</a></li>
                    </ul>
                </div>
                <div className="col-md-3 d-flex flex-column">
                    <h2><a href="#">Premium Services</a></h2>
                    <ul className="list-unstyled">
                        <li><a href="#" target="_blank">Get a demo</a></li>
                    </ul>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
