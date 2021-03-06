import React, { Component } from 'react';
import Axios from 'axios';
import Moment from 'moment';
import Icon from '../../../components/Icon';
import Comments from '../Comments';
import ClassNames from 'classnames';
import ArticleLoading from './article-loading';

Moment.locale('zh-cn');

const WEIBOKEY = '';
export default class Article extends Component {
    constructor(props) {
        super(props);
        const { article, comments } = props;
        this.state = {
            article,
            comments
        };
    }

    componentWillMount() {
        const { match: {params} } = this.props;
        const { article } = this.state;
        if (!article || article.id != params.id) {
            Axios.get(`/api/get/article/${params.id}`, {
                params: {
                    filter: 1
                }
            })
            .then( res => {
                let resData = res.data;
                document.title = `${resData.article.title}  - 「JI · 记小栈」`;
                this.setState({
                    article: resData.article
                });
            })

            Axios.get(`/api/get/comments?articleid=${params.id}`)
                .then( res => {
                    let resData = res.data;
                    this.setState({
                        comments: resData.comments
                    })
                })
        }
    }

    componentDidMount() {
        const { article } = this.state;
        if (article) {
            document.title = `${article.title}  - 「JI · 记小栈」`;
        }
    }

    render() {
        const { article, comments } = this.state;
        const { match: {params} } = this.props;
        let _article = article || {};
        let cls = ClassNames('blog-article-layout', { [`blog-article-${_article.category && _article.category.toLocaleLowerCase()}`]:  _article.category});
        return (
            <div className={cls} >
                { _article.category == "TRAVEL" ? <div className="article-banner">
                    <div className="bg" style={{backgroundImage: `url(${ _article.banner ? _article.banner : "//cdn.liayal.com/12027196.jpg" })`} } />
                    <h2 className="article-title">{_article.title}</h2>
                </div> : null}
                { article ? <article className='blog-article-body'>
                    { _article.category != "TRAVEL" ? <h2 className="article-title"><p><em>{_article.title}</em></p></h2> : null}
                    <p className="article-desc">
                        <span><Icon type='date' /> {Moment(_article.createTime).format('LL')}</span>
                        { _article.tags && _article.tags.length ? <span className="ml"><Icon type='cc-tag' /> {_article.tags.map( tag => tag.name + ' ')}</span> : null }
                        <span className="ml"><Icon type='visit' /> {_article.visited || 0}</span>
                    </p>
                    <div className="article-content" dangerouslySetInnerHTML={ {__html: _article.htmlContent} } />
                    <div className='article-tips'>
                        <p>如非特别注明，文章皆为原创。</p>
                        <p><b>转载请注明出处：</b> <a href={`https://www.liayal.com/article/${_article.id}`}>{`http://www.liayal.com/article/${_article.id}`}</a></p>
                    </div>
                </article> : <ArticleLoading />}
                <section className='article-share-box'>
                    <a href={`https://service.weibo.com/share/share.php?url=${encodeURIComponent(`http://www.liayal.com/article/${_article.id}`)}&title=${encodeURIComponent(_article.title)}&pic=${encodeURIComponent(_article.banner || '')}&appkey=${WEIBOKEY}` } className="share-icon">
                        <Icon type="weibo" />
                    </a>
                    <a href={ `http://sns.qzone.qq.com/cgi-bin/qzshare/cgi_qzshare_onekey?url=${encodeURIComponent(`http://www.liayal.com/article/${_article.id}`)}&title=${encodeURIComponent(_article.title)}&desc=${encodeURIComponent(_article.abstract)}&summary=${encodeURIComponent(_article.abstract)}&site=${encodeURIComponent('//hynal.com')}` } className="share-icon">
                        <Icon type="qzone" />
                    </a>
                    <a href={ `http://shuo.douban.com/!service/share?href=${encodeURIComponent(`http://www.liayal.com/article/${_article.id}`)}&name=${encodeURIComponent(_article.title)}&text=${encodeURIComponent(_article.abstract)}&image=${encodeURIComponent(_article.banner || '')}&starid=0&aid=0&style=11` } className="share-icon">
                        <Icon type="douban" />
                    </a>
                </section>
                <Comments articleid={params.id} comments={comments} />
            </div>
        )
    }
}