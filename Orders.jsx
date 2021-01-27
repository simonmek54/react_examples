import React, {Component} from 'react';
import 'whatwg-fetch';
import classNames from 'classnames';
import _ from 'lodash';
import moment from 'moment';
import Fancybox from './Fancybox.jsx';
import NumberFormat from '../react-number-format/number_format.js';

class Paginator extends Component {
    render () {
        const { offset, limit, count, setOffset, fetch } = this.props;
        const pages = Math.ceil(count / limit);
        const activePage = offset / limit + 1;
        const radius = 2;
        const leftBorder = (activePage - radius) < 1 ? 1 : activePage - radius;
        const rightBorder = (activePage + radius) > pages ? pages : activePage + radius;
        let prev, next, first, last, leftGap, rightGap;
        return (
            <nav className={`pagination_custom ${(pages<=1) ? "d-none" : ""}`}>

                <div className="pagination_custom-control -to-start d-none d-md-flex" onClick={() => {
                    setOffset((0)* limit, fetch)
                }}>
                    <span className="pagination_custom-link" itemProp="item">
                        <span className="pagination_custom-name" itemProp="name">В начало</span>
                    </span>
                </div>

                {
                    activePage > 1 &&
                    <div className="pagination_custom-control -prev" onClick={() => {
                        setOffset((activePage - 2) * limit, fetch)
                    }}>
                        <span className="pagination_custom-link" itemProp="item">
                                <span className="pagination_custom-name" itemProp="name">
                                    <div className="icon -arrow-right"></div>
                                </span>
                        </span>
                    </div>
                }

                {_.range(leftBorder, rightBorder + 1).map((item) => {
                    let className = classNames('pagination_custom-page', {'-current-': item == activePage});
                    return (
                        <div itemProp="itemListElement" itemScope="itemscope"
                             itemType="http://schema.org/ListItem" key={item} className={className} onClick={(e) => {
                            setOffset((item - 1) * limit, fetch)
                        }}>
                            <span className="pagination_custom-link" itemProp="item">
                                 <span className="pagination_custom-name" itemProp="name">{item}</span>
                            </span>
                            <meta itemProp="position" content={item}/>
                        </div>
                    )
                })}
                {
                    activePage < pages &&
                    <div className="pagination_custom-control" onClick={() => {
                        setOffset(activePage * limit, fetch)
                    }}>
                        <span className="pagination_custom-link" itemProp="item">
                                <span className="pagination_custom-name" itemProp="name">
                                    <div className="icon -arrow-right"></div>
                                </span>
                        </span>
                    </div>
                }
                <div className="pagination_custom-control -to-end d-none d-md-flex" onClick={() => {
                    setOffset((pages-1) * limit, fetch)
                }}>
                    <span className="pagination_custom-link" itemProp="item">
                        <span className="pagination_custom-name" itemProp="name">В конец</span>
                    </span>
                </div>
            </nav>
        );
    }
}

export default class Orders extends Component {
    constructor(props) {
        super(props);
        this.state = {
            fetching: false,
            offset: 0,
            limit: 12,
            count: 0,
            filter: {
                dateFrom: null,
                dateTo: null,
            },
            select: 'all',
            items: [],
            showOrderPopup: false,
            orderDetail: {}
        };
        this.showDetail = this.showDetail.bind(this);
        this.hideDetail = this.hideDetail.bind(this);

    }
    hideDetail = () => {
        this.setState({ showOrderPopup: false });
    }
    setStatePromise = (state) => {
        return new Promise((resolve, reject) => {
            this.setState(state, resolve);
        });
    }
    serializeFilter = (filter) => {
        const { dateFrom , dateTo, debit } = filter;
        const from = dateFrom ? dateFrom.format('DD.MM.YYYY') : null;
        const to = dateTo ? dateTo.format('DD.MM.YYYY') : null;
        const newFilter = {};
        if (from && to) {
            newFilter['><date_status'] = [from, to];
        }
        if (debit) {
            newFilter.debit = debit;
        }
        return JSON.stringify(newFilter);
    }
    fetch = () => {
        let status;
        const { offset, limit, filter } = this.state
        const filterSerialized = this.serializeFilter(filter);
        return this.setStatePromise({ fetching: true })
            .then(() => {
                return fetch(`/user_api/orders/count/${filterSerialized}`, {
                    credentials: 'same-origin'
                });
            })
            .then((response) => {
                status = response.status;
                if (status === 200) {
                    return response.json();
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                if (status === 200) {
                    return this.setStatePromise({ count: data })
                } else if (status == 403) {
                    document.location.reload(true);
                }
            })
            .then(() => {
                return fetch(`/user_api/orders/${offset}/${limit}`, {
                    credentials: 'same-origin'
                });
            })
            .then((response) => {
                status = response.status;
                if (status === 200) {
                    return response.json();
                } else {
                    return response.text();
                }
            })
            .then((data) => {
                if (status === 200) {
                    return this.setStatePromise({ items: data, fetching: false })
                } else if (status == 403) {
                    document.location.reload(true);
                }
            })
    }
    setOffset = (offset, callback) => {
        this.setState({offset}, callback);
    }

    showDetail(e, order){
        e.preventDefault();         
        this.setState({ showOrderPopup: true, orderDetail: order });        
    };   

    componentDidMount() {
        this.fetch();
    };
    render() {
        const { items, fetching, showOrderPopup, orderDetail } = this.state;
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        const fadeClass = classNames('filter-fade', {'fade-active' : fetching});
        return (
            <div className="col-lg-8">                        
                <div className="grid-block -transparent-">
                    <div className={fadeClass}>
                        <div><i className="fa fa-spinner fa-spin fa-3x fa-fw"></i></div>
                    </div>
                    <div className="main-table-row d-none d-md-flex">
                        <div className="col-5 main-table-cell -default-">
                            <div className="text_p -sbold- -mb0- -grey-">Дата</div>
                        </div>
                        <div className="col-7 main-table-cell -md-">
                            <div className="text_p -sbold- -mb0- -grey-">Номер заказа</div>
                        </div>
                        <div className="col-5 main-table-cell -default-">
                            <div className="text_p -sbold- -mb0- -grey-">Сумма</div>
                        </div>
                        <div className="col-7 main-table-cell -default-">
                            <div className="text_p -sbold- -mb0- -grey-">Статус</div>
                        </div>
                    </div>
                    {
                        _.map(items, (item, key) => {
                            const date = item.DATE_INSERT;
                            const price = parseInt(item.BASKET_PRICE);
                            const product = item.product;
                            const status = item.STATUS ? item.STATUS : 'Информация недоступна в данный момент';
                            // const status = item.SALE_INTERNALS_ORDER_STATUS_NAME ? item.SALE_INTERNALS_ORDER_STATUS_NAME  : item.PROPERTY.EXTERNAL_ORDER_STATUS;
                            return (
                                <a key={key} className="main-table-row" href="#" onClick={(e) => this.showDetail(e, item)}>
                                    <div className="col-5 main-table-cell -default- -mborder-">
                                        <div className="text_p -mb0- -grey- d-md-none">Дата</div>
                                        <div className="text_p -mb0-">{ date }</div>
                                    </div>
                                    <div className="col-7 main-table-cell -md- -mborder-">
                                        <div className="text_p -mb0- -grey- d-md-none">Номер заказа</div>
                                        <div className="text_p -mb0-">{item.ID}</div>
                                    </div>
                                    <div className="col-5 main-table-cell -default-">
                                        <div className="text_p -mb0- -grey- d-md-none">Сумма</div>
                                        <div className="text_p -mb0-"><NumberFormat value={ price } displayType="text" thousandSeparator=" " /> Б</div>
                                    </div>
                                    <div className="col-7 main-table-cell -default-">
                                        <div className="text_p -mb0- -grey- d-md-none">Статус</div>
                                        <div className="text_p -mb0-">{status}</div>
                                    </div>
                                </a>
                            );
                        })
                    }

                </div>
                <Paginator {...this.state} setOffset={this.setOffset} fetch={this.fetch}/>
                <Fancybox show={showOrderPopup} onHide={this.hideDetail}>
                    {orderDetail && orderDetail.ID &&
                    <div className="fancybox_popup js-fancybox -personal fancybox-content -success- -reject-">
                         <div className="popup-order">
                            <div className="h3 -bold-">Заказ №{ orderDetail.ID } от { orderDetail.DATE_INSERT } </div>
                            <div className="b-personal">
                                <div className="b-personal__list">
                                    <div className="b-personal__item">
                                        <div className="text_p -sbold- -grey-">Статус</div>
                                        <div className="text_p">{ orderDetail.STATUS }</div>
                                    </div>
                                    { orderDetail.PROPERTY && (orderDetail.PROPERTY.FIO || orderDetail.PROPERTY.PHONE || orderDetail.PROPERTY.EMAIL) && 
                                    <div className="b-personal__item">
                                        <div className="text_p -sbold- -grey-">Получатель</div>
                                        <div className="text_p">{ orderDetail.PROPERTY && orderDetail.PROPERTY.FIO && orderDetail.PROPERTY.FIO.split(" ").map((item, key) => { return (<span key={key}>{item}<br/></span>) }) } {orderDetail.PROPERTY.PHONE && <span> +7 { ('+' + orderDetail.PROPERTY.PHONE).replace('+7','').replace(phoneRegex, '($1) $2-$3') }<br/></span>}{ orderDetail.PROPERTY.EMAIL }</div>
                                    </div> }
                                </div>
                            </div>
                            <div className="basket__table">
                                { orderDetail.BASKET &&  Object.values(orderDetail.BASKET).map((item, key) => {
                                    const src = (item.TP && item.TP.PRODUCT_PICTURE) ? item.TP.PRODUCT_PICTURE : item.PROPERTY.PRODUCT_PICTURE;
                                    return (
                                        <div className="basket__row" key={key}>
                                            <div className="basket__cell -product">
                                                <div className="basket-card">
                                                    <div className="basket-card__img-wrap"><img src={ src } /></div>
                                                    <div className="basket-card__name">{item.NAME}</div>
                                                </div>
                                            </div>
                                            <div className="basket__cell -count">
                                                <div className="basket__price">{ parseInt(item.QUANTITY) }</div>
                                            </div>
                                            <div className="basket__cell -price">
                                                <div className="basket__price"><NumberFormat value={ item.PRICE_SUMMARY } displayType="text" thousandSeparator=" " /> Б.</div>
                                            </div>
                                        </div>

                                    )})
                                }

                            </div>
                            <div className="basket__bottom">
                                <div className="basket__total">Итого:<span> <NumberFormat value={ orderDetail.BASKET_PRICE } displayType="text" thousandSeparator=" " /> Б.</span></div>
                            </div>
                        </div>
                        <button type="button" data-fancybox-close="" className="fancybox-button fancybox-close-small" title="Close" onClick={this.hideDetail}><svg xmlns="http://www.w3.org/2000/svg" version="1" viewBox="0 0 24 24"><path d="M13 12l5-5-1-1-5 5-5-5-1 1 5 5-5 5 1 1 5-5 5 5 1-1z"></path></svg></button>
                    </div> }
                </Fancybox>       
            </div>
        );
    }
}