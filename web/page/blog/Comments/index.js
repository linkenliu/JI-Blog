import React, { Component } from 'react';
import PropTypes from 'prop-types';
import ClassNames from 'classnames';
import Icon from '../../../components/Icon';
import Emojify from 'react-emojione';
import CommentInput from './commentInput';
import Axios from 'axios';
import { message } from 'antd';

const emojiStyle = {
    height: 20,
    backgroundImage: 'url("http://ozrrmt7n9.bkt.clouddn.com/image/emojione-3.1.2-32x32.png")'
};
export default class Comments extends Component {
    constructor(props) {
        super(props);

        this.state = {
            showUserInfo: false,
            isShowReplyModal: false,
            reply: null,
            comments: props.comments,
            commentCont: null
        };

        this.caretIndex = 0;
    }

    static defaultProps = {
        articleid: '',
        comments: []
    };

    static defaultPropTypes = {
        comments: PropTypes.array
    };

    componentWillReceiveProps(nextProps) {
        this.setState({
            comments: nextProps.comments
        })
    }

    exportComment = commentCont => {
        const { reply } = this.state;
        if (this.user && commentCont) {
            this.saveComment({
                user: this.user,
                reply: reply ? reply.id : null,
                commentCont
            });
        } else if (commentCont) {
            this.setState({
                showUserInfo: true,
                commentCont
            });
        }
    }

    commentSubmit = () => {
        const name = this.refs.userName.value,
            email = this.refs.userEamil.value,
            site = this.refs.userSite.value,
            emailReg = /^[a-zA-Z0-9_-]+@[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)+$/g;
        const { reply, commentCont } = this.state;

        if (!email || !name ) return message.info('填一下昵称和邮箱呗！');

        if (!emailReg.test(email)) return message.info('邮箱格式不正确呀！');

        this.user = {name, email, site};

        this.saveComment({
            user: this.user,
            reply: reply ? reply.id : null,
            commentCont
        });
    }

    commentCancle = () => {
        this.setState({
            showUserInfo: false
        })
    }

    saveComment(data) {
        const { articleid } = this.props;
        let comments = this.state.comments;
        Axios.post('/api/create/comment', {...data, articleid})
            .then( res => {
                let resdata = res.data;
                if (resdata.code  == 200) {
                    comments.unshift(resdata.comment);
                    this.setState({
                        showUserInfo: false,
                        isShowReplyModal: false,
                        reply: null,
                        comments: comments,
                        commentCont: null
                    });
                } else {
                    message.warning(resdata.message);
                }
            })
            .catch( err => {
                message.warning('发布失败');
            })
    }

    showReplyModal = (comment) => {
        this.setState({
            isShowReplyModal: true,
            reply: comment
        })
    }

    closeReplyModal = () => {
        this.setState({
            isShowReplyModal: false
        })
    }

    render() {
        const { showUserInfo, isShowReplyModal, reply, comments } = this.state;
        return (
            <article className="blog-comment">
                <CommentInput exportComment={ this.exportComment } />

                <div className="comment-list">
                    { comments.length ? comments.map((comment, index) => (<div className="comment-item clearfix border-b" key={index} >
                        <div className="comment-avatar fl"><Icon type='avatar' /></div>
                        <div className="comment-body fl">
                            <h6>{comment.user.name}<small>34分钟前</small></h6>
                            { comment.reply ? <Emojify style={emojiStyle}><blockquote>@{comment.reply.user.name}: {comment.reply.commentCont}</blockquote></Emojify> : null}
                            <Emojify style={emojiStyle} ><p>{comment.commentCont}</p></Emojify>
                            <div className="comment-reply">
                                <Icon type='reply' onClick={ e => {this.showReplyModal(comment)} } />
                            </div>
                        </div>
                    </div>)) : null}
                </div>

                <div className="comment-modal" hidden={!showUserInfo} style={{zIndex: 5}}>
                    <div className="comment-user-modal-form">
                            <img src="//ozrrmt7n9.bkt.clouddn.com/image/logo.png" alt=""/>
                            <input type="text" name="name" placeholder='昵称(必填)' ref='userName' />
                            <input type="text" name="email" placeholder='xxxx@qq.com(必填)' ref='userEamil' />
                            <input type="text" name="site" placeholder='www.yourblog.com' ref='userSite' />
                            <div className="btns">
                                <button onClick={ this.commentCancle }>取消</button>
                                <button onClick={ this.commentSubmit } >确认</button>
                            </div>
                    </div>
                </div>

                <div className="comment-modal" hidden={!isShowReplyModal} >
                    <div className="comment-reply-from">
                        <h6 className='tl'>回复：{ reply && reply.user.name} <Icon type='close-x comment-close' onClick={ this.closeReplyModal } /></h6>
                        <CommentInput exportComment={ this.exportComment } />
                    </div>
                </div>
            </article>
        )
    }
}