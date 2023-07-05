(this.webpackJsonpmikro = this.webpackJsonpmikro || []).push([
  [0],
  {
    165: function (e, t, n) {},
    177: function (e, t, n) {},
    178: function (e, t, n) {},
    179: function (e, t, n) {},
    180: function (e, t, n) {},
    181: function (e, t, n) {},
    194: function (e, t, n) {},
    195: function (e, t, n) {},
    196: function (e, t, n) {},
    197: function (e, t, n) {},
    198: function (e, t, n) {},
    199: function (e, t, n) {},
    200: function (e, t, n) {},
    201: function (e, t, n) {},
    203: function (e, t, n) {},
    210: function (e, t, n) {
      "use strict";
      n.r(t);
      var i,
        a = n(1),
        c = n.n(a),
        s = n(47),
        r = n.n(s),
        o = (n(165), n(3)),
        l = n(119),
        j = n(30),
        d = n(156),
        u = n(0),
        b = Object(a.createContext)({}),
        x = function (e) {
          var t = e.children,
            n = Object(a.useState)({
              visible: !1,
              type: null,
              heading: null,
              message: null,
            }),
            i = Object(o.a)(n, 2),
            c = (i[0], i[1]),
            s = {
              name: "Tabula Rasa",
              theme: Object(d.a)({
                palette: {
                  primary: { main: "#ffffff" },
                  secondary: { main: "#6a6c7c" },
                },
              }),
              setGenericAlert: c,
            };
          return Object(u.jsx)(b.Provider, { value: s, children: t });
        },
        h = "http://dev.localhost:5004/api/",
        g = "http://dev.localhost:5001/api/",
        O = function (e, t) {
          var n = Object(a.useState)(function () {
              return JSON.parse(localStorage.getItem(e)) || t;
            }),
            i = Object(o.a)(n, 2),
            c = i[0],
            s = i[1];
          return (
            Object(a.useEffect)(
              function () {
                null !== c && void 0 !== c
                  ? localStorage.setItem(e, JSON.stringify(c))
                  : localStorage.removeItem(e);
              },
              [e, c]
            ),
            [c, s]
          );
        },
        p = n(66),
        f = n.n(p),
        m = Object(a.createContext)({}),
        v = function (e) {
          var t = e.children,
            n = O("mikro.user", null),
            i = Object(o.a)(n, 2),
            c = i[0],
            s = i[1],
            r = Object(a.useContext)(ye).history,
            l = {
              logout: function () {
                fetch(g.concat("auth/logout"), { method: "POST" }).then(
                  function () {
                    s(null);
                  }
                );
              },
              refresh: function () {
                fetch(g.concat("auth/refresh"), {
                  method: "POST",
                  credentials: "include",
                  headers: { "X-CSRF-TOKEN": f.a.get("csrf_access_token") },
                })
                  .then(function (e) {
                    return (
                      e.ok ||
                        (alert(
                          "Refreshing access token failed, please log in again"
                        ),
                        r.push("/login")),
                      e
                    );
                  })
                  .catch(function () {
                    alert(
                      "Refreshing access token failed, please log in again"
                    ),
                      r.push("/login");
                  })
                  .then(function () {});
              },
              user: c,
              setUser: s,
            };
          return Object(u.jsx)(m.Provider, { value: l, children: t });
        },
        y = n(22),
        w = n(35);
      function S(e, t) {
        return _.apply(this, arguments);
      }
      function _() {
        return (
          (_ = Object(w.a)(
            Object(y.a)().mark(function e(t, n) {
              var a,
                c = arguments;
              return Object(y.a)().wrap(function (e) {
                for (;;)
                  switch ((e.prev = e.next)) {
                    case 0:
                      return (
                        c.length > 2 && void 0 !== c[2] && c[2],
                        (e.next = 3),
                        fetch(h.concat(n), {
                          method: "POST",
                          body: JSON.stringify(t),
                          headers: {
                            "Content-Type": "application/json",
                            mode: "cors",
                            "X-CSRF-TOKEN": "".concat(
                              f.a.get("csrf_access_token")
                            ),
                          },
                        })
                      );
                    case 3:
                      if (!(a = e.sent).ok) {
                        e.next = 10;
                        break;
                      }
                      return (e.next = 7), a.json();
                    case 7:
                      (i = e.sent), (e.next = 11);
                      break;
                    case 10:
                      a.ok || (i = { response: "error" });
                    case 11:
                      return e.abrupt("return", i);
                    case 12:
                    case "end":
                      return e.stop();
                  }
              }, e);
            })
          )),
          _.apply(this, arguments)
        );
      }
      function k(e) {
        return A.apply(this, arguments);
      }
      function A() {
        return (A = Object(w.a)(
          Object(y.a)().mark(function e(t) {
            var n;
            return Object(y.a)().wrap(function (e) {
              for (;;)
                switch ((e.prev = e.next)) {
                  case 0:
                    return (
                      (e.next = 2),
                      fetch(h.concat(t), {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                          mode: "cors",
                          "X-CSRF-TOKEN": "".concat(
                            f.a.get("csrf_access_token")
                          ),
                        },
                      })
                    );
                  case 2:
                    if (!(n = e.sent).ok) {
                      e.next = 9;
                      break;
                    }
                    return (e.next = 6), n.json();
                  case 6:
                    (i = e.sent), (e.next = 10);
                    break;
                  case 9:
                    n.ok || (i = { response: "Error" });
                  case 10:
                    return e.abrupt("return", i);
                  case 11:
                  case "end":
                    return e.stop();
                }
            }, e);
          })
        )).apply(this, arguments);
      }
      function C(e) {
        var t = Object(a.useState)(e),
          n = Object(o.a)(t, 2),
          i = n[0],
          c = n[1];
        return [
          i,
          function (e) {
            c(function (t) {
              return "boolean" === typeof e ? e : !t;
            });
          },
        ];
      }
      var P,
        D,
        R,
        T,
        E,
        I,
        L,
        B,
        U,
        M,
        F,
        Y,
        N,
        q,
        z,
        K,
        V,
        H,
        W,
        Q,
        G,
        J,
        X,
        Z,
        $,
        ee,
        te,
        ne,
        ie,
        ae,
        ce,
        se,
        re,
        oe,
        le,
        je,
        de,
        ue,
        be,
        xe,
        he,
        ge,
        Oe,
        pe,
        fe,
        me,
        ve,
        ye = Object(a.createContext)({}),
        we = function (e) {
          var t = e.children;
          Object(l.a)(Object(a.useContext)(b)),
            Object(l.a)(Object(a.useContext)(m));
          var n = C(!0),
            i = Object(o.a)(n, 2),
            c = i[0],
            s = i[1],
            r = Object(a.useState)([]),
            d = Object(o.a)(r, 2),
            x = d[0],
            h = d[1],
            g = Object(a.useState)([]),
            O = Object(o.a)(g, 2),
            p = O[0],
            f = O[1],
            v = Object(a.useState)(null),
            y = Object(o.a)(v, 2),
            w = y[0],
            _ = y[1],
            A = Object(a.useState)(null),
            P = Object(o.a)(A, 2),
            D = P[0],
            R = P[1],
            T = Object(a.useState)(null),
            E = Object(o.a)(T, 2),
            I = E[0],
            L = E[1],
            B = Object(a.useState)(null),
            U = Object(o.a)(B, 2),
            M = U[0],
            F = U[1],
            Y = Object(a.useState)(null),
            N = Object(o.a)(Y, 2),
            q = N[0],
            z = N[1],
            K = Object(a.useState)(null),
            V = Object(o.a)(K, 2),
            H = V[0],
            W = V[1],
            Q = Object(a.useState)(null),
            G = Object(o.a)(Q, 2),
            J = G[0],
            X = G[1],
            Z = Object(a.useState)(null),
            $ = Object(o.a)(Z, 2),
            ee = $[0],
            te = $[1],
            ne = Object(a.useState)(null),
            ie = Object(o.a)(ne, 2),
            ae = ie[0],
            ce = ie[1],
            se = Object(a.useState)(null),
            re = Object(o.a)(se, 2),
            oe = re[0],
            le = re[1],
            je = Object(a.useState)(!1),
            de = Object(o.a)(je, 2),
            ue = de[0],
            be = de[1],
            xe = Object(j.g)(),
            he = Object(a.useState)(null),
            ge = Object(o.a)(he, 2),
            Oe = ge[0],
            pe = ge[1],
            fe = Object(a.useState)([]),
            me = Object(o.a)(fe, 2),
            ve = me[0],
            we = me[1],
            Se = Object(a.useState)([]),
            _e = Object(o.a)(Se, 2),
            ke = _e[0],
            Ae = _e[1],
            Ce = Object(a.useState)([]),
            Pe = Object(o.a)(Ce, 2),
            De = Pe[0],
            Re = Pe[1],
            Te = Object(a.useState)(null),
            Ee = Object(o.a)(Te, 2),
            Ie = Ee[0],
            Le = Ee[1],
            Be = Object(a.useState)(null),
            Ue = Object(o.a)(Be, 2),
            Me = Ue[0],
            Fe = Ue[1],
            Ye = Object(a.useState)(null),
            Ne = Object(o.a)(Ye, 2),
            qe = Ne[0],
            ze = Ne[1],
            Ke = Object(a.useState)(null),
            Ve = Object(o.a)(Ke, 2),
            He = Ve[0],
            We = Ve[1],
            Qe = Object(a.useState)(null),
            Ge = Object(o.a)(Qe, 2),
            Je = Ge[0],
            Xe = Ge[1],
            Ze = Object(a.useState)(null),
            $e = Object(o.a)(Ze, 2),
            et = $e[0],
            tt = $e[1],
            nt = Object(a.useState)(null),
            it = Object(o.a)(nt, 2),
            at = it[0],
            ct = it[1],
            st = Object(a.useState)(null),
            rt = Object(o.a)(st, 2),
            ot = rt[0],
            lt = rt[1],
            jt = Object(a.useState)(null),
            dt = Object(o.a)(jt, 2),
            ut = dt[0],
            bt = dt[1],
            xt = Object(a.useState)(null),
            ht = Object(o.a)(xt, 2),
            gt = ht[0],
            Ot = ht[1],
            pt = Object(a.useState)(null),
            ft = Object(o.a)(pt, 2),
            mt = ft[0],
            vt = ft[1],
            yt = Object(a.useState)([]),
            wt = Object(o.a)(yt, 2),
            St = wt[0],
            _t = wt[1],
            kt = function (e) {
              ze(e.active_projects),
                We(e.inactive_projects),
                Xe(e.completed_projects),
                tt(e.mapped_tasks),
                ct(e.validated_tasks),
                lt(e.invalidated_tasks),
                bt(e.payable_total > 0 ? e.payable_total : 0),
                Ot(e.requests_total > 0 ? e.requests_total : 0),
                vt(e.payouts_total > 0 ? e.payouts_total : 0);
            },
            At = function (e, t) {
              switch (e) {
                case "first_name":
                  R(t.target.value);
                  break;
                case "last_name":
                  L(t.target.value);
                  break;
                case "osm_name":
                  z(t.target.value);
                  break;
                case "city":
                  W(t.target.value);
                  break;
                case "country":
                  X(t.target.value);
                  break;
                case "email":
                  te(t.target.value);
                  break;
                case "pay_email":
                  ce(t.target.value);
                  break;
                case "response":
                  R(t.first_name),
                    L(t.last_name),
                    F(t.full_name),
                    z(t.osm_username),
                    W(t.city),
                    X(t.country),
                    te(t.email),
                    ce(t.payment_email);
              }
            },
            Ct = function () {
              k("user/fetch_users").then(function (e) {
                200 === e.status
                  ? h(e.users)
                  : 304 === e.status
                  ? xe.push("/login")
                  : alert(e.message);
              });
            },
            Pt = function (e) {
              S({ project_id: e }, "user/fetch_project_users").then(function (
                e
              ) {
                200 === e.status
                  ? f(e.users)
                  : 304 === e.status
                  ? xe.push("/login")
                  : alert(e.message);
              });
            },
            Dt = function () {
              k("project/fetch_org_projects").then(function (e) {
                if (200 === e.status)
                  return (
                    Le(e.org_active_projects), void Fe(e.org_inactive_projects)
                  );
                304 === e.status ? xe.push("/login") : alert(e.message);
              });
            },
            Rt = function () {
              k("project/fetch_user_projects").then(function (e) {
                if (200 === e.status)
                  return (
                    Le(e.org_active_projects), void Fe(e.org_inactive_projects)
                  );
                304 === e.status ? xe.push("/login") : alert(e.message);
              });
            },
            Tt = function () {
              k("transaction/fetch_org_transactions").then(function (e) {
                if (200 === e.status)
                  return (
                    console.log(e.payments),
                    we(e.requests),
                    Ae(e.payments),
                    void It(e.payments)
                  );
                304 === e.status ? xe.push("/login") : alert(e.message);
              });
            },
            Et = function () {
              k("transaction/fetch_user_transactions").then(function (e) {
                if (200 === e.status)
                  return (
                    console.log(e.payments),
                    we(e.requests),
                    Ae(e.payments),
                    void It(e.payments)
                  );
                304 === e.status ? xe.push("/login") : alert(e.message);
              });
            },
            It = function (e) {
              var t = [];
              if (Object.keys(e).length > 0) {
                var n = Object.keys(e[0]);
                t.push(n),
                  e.forEach(function (e) {
                    var i = [];
                    n.forEach(function (t) {
                      i.push(e[t]);
                    }),
                      t.push(i);
                  }),
                  _t(t);
              }
            },
            Lt = {
              history: xe,
              userSelected: Oe,
              orgUsers: x,
              sidebarOpen: c,
              fetching: ue,
              firstName: D,
              lastName: I,
              OSMname: q,
              city: H,
              country: J,
              email: ee,
              payEmail: ae,
              fullName: M,
              outputRate: oe,
              projectUsers: p,
              activeProjects: Ie,
              inactiveProjects: Me,
              completedProjects: Je,
              tasksMapped: et,
              tasksValidated: at,
              tasksInvalidated: ot,
              payableTotal: ut,
              requestsTotal: gt,
              paidTotal: mt,
              projectSelectedDetails: w,
              orgPayments: ke,
              orgRequests: ve,
              CSVdata: St,
              orgProjects: De,
              activeProjectsCount: qe,
              inactiveProjectsCount: He,
              setActiveProjectsCount: ze,
              setInactiveProjectsCount: We,
              setorgProjects: Re,
              setCSVdata: _t,
              setOrgRequests: we,
              setOrgPayments: Ae,
              setProjectSelectedDetails: _,
              setProjectUsers: f,
              setFullName: F,
              setFirstName: R,
              setLastName: L,
              setOSMname: z,
              setCity: W,
              setCountry: X,
              setEmail: te,
              setPayEmail: ce,
              setUserSelected: pe,
              setFetching: be,
              handleUserDetailsStates: At,
              handleSetSidebarState: function () {
                s();
              },
              handleOutputRate: function (e) {
                le(e.target.value);
              },
              firstLoginUpdate: function (e, t, n, i, a) {
                S(
                  {
                    osm_username: e,
                    payment_email: t,
                    country: n,
                    city: i,
                    terms_agreement: a,
                  },
                  "user/first_login_update"
                ).then(function (e) {
                  200 !== e.status &&
                    (304 === e.status ? xe.push("/login") : alert(e.message));
                });
              },
              fetchOrgUsers: Ct,
              fetchUserDetails: function () {
                k("user/fetch_user_details").then(function (e) {
                  200 === e.status
                    ? At("response", e)
                    : 304 === e.status
                    ? xe.push("/login")
                    : alert(e.message);
                });
              },
              updateUserDetails: function () {
                S(
                  {
                    first_name: D,
                    last_name: I,
                    osm_username: q,
                    city: H,
                    country: J,
                    email: ee,
                    payment_email: ae,
                  },
                  "user/update_user_details"
                ).then(function (e) {
                  200 !== e.status &&
                    (304 === e.status ? xe.push("/login") : alert(e.message));
                });
              },
              inviteUser: function (e) {
                S({ email: e }, "user/invite_user").then(function (e) {
                  304 === e.status ? xe.push("/login") : alert(e.message);
                });
              },
              removeUser: function (e) {
                S({ user_id: e }, "user/remove_users").then(function (e) {
                  200 !== e.status
                    ? 304 === e.status
                      ? xe.push("/login")
                      : alert(e.message)
                    : Ct();
                });
              },
              modifyUser: function (e, t) {
                S({ user_id: e, role: t }, "user/modify_users").then(function (
                  e
                ) {
                  200 !== e.status
                    ? 304 === e.status
                      ? xe.push("/login")
                      : alert(e.message)
                    : Ct();
                });
              },
              userJoinProject: function (e) {
                S({ project_id: e }, "project/user_join_project").then(
                  function (e) {
                    if (200 === e.status) return alert(e.message), void Rt();
                    304 === e.status ? xe.push("/login") : alert(e.message);
                  }
                );
              },
              userLeaveProject: function (e) {
                S({ project_id: e }, "project/user_leave_project").then(
                  function (e) {
                    if (200 === e.status) return alert(e.message), void Rt();
                    304 === e.status ? xe.push("/login") : alert(e.message);
                  }
                );
              },
              assignUserProject: function (e, t) {
                S(
                  { project_id: e, user_id: t },
                  "project/assign_user_project"
                ).then(function (t) {
                  if (200 === t.status) return alert(t.message), void Pt(e);
                  304 === t.status ? xe.push("/login") : alert(t.message);
                });
              },
              unassignUserProject: function (e, t) {
                S(
                  { project_id: e, user_id: t },
                  "project/unassign_user_project"
                ).then(function (t) {
                  if (200 === t.status) return alert(t.message), void Pt(e);
                  304 === t.status ? xe.push("/login") : alert(t.message);
                });
              },
              fetchUserProjects: Rt,
              fetchProjectUsers: Pt,
              fetchOrgProjects: Dt,
              deleteProject: function (e) {
                S({ project_id: e }, "project/delete_project").then(function (
                  t
                ) {
                  if (200 === t.status)
                    return (
                      alert("Project ".concat(e, " has been deleted.")),
                      void Dt()
                    );
                  304 === t.status ? xe.push("/login") : alert(t.message);
                });
              },
              calculateProjectBudget: function (e, t, n) {
                S(
                  {
                    url: e,
                    rate_type: t,
                    rate: n,
                    project_id:
                      arguments.length > 3 && void 0 !== arguments[3]
                        ? arguments[3]
                        : null,
                  },
                  "project/calculate_budget"
                ).then(function (e) {
                  200 !== e.status
                    ? 304 === e.status
                      ? xe.push("/login")
                      : alert(e.message)
                    : le(e.calculation);
                });
              },
              createProject: function (e, t, n, i, a) {
                S(
                  {
                    url: e,
                    rate_type: t,
                    rate: n,
                    max_editors: i,
                    visibility: a,
                  },
                  "project/create_project"
                ).then(function (e) {
                  if (200 === e.status)
                    return alert("New Project Created"), void Dt();
                  304 === e.status ? xe.push("/login") : alert(e.message);
                });
              },
              updateProject: function (e, t, n, i, a, c, s) {
                S(
                  {
                    project_id: e,
                    rate_type: t,
                    rate: n,
                    max_editors: i,
                    visibility: a,
                    difficulty: c,
                    project_status: s,
                  },
                  "project/update_project"
                ).then(function (t) {
                  if (200 === t.status)
                    return (
                      alert("Project ".concat(e, " has been Updated.")),
                      void Dt()
                    );
                  304 === t.status ? xe.push("/login") : alert(t.message);
                });
              },
              fetchAdminDashStats: function () {
                k("project/fetch_admin_dash_stats").then(function (e) {
                  200 !== e.status
                    ? 304 === e.status
                      ? xe.push("/login")
                      : alert(e.message)
                    : kt(e);
                });
              },
              fetchUserDashStats: function () {
                k("project/fetch_user_dash_stats").then(function (e) {
                  200 !== e.status
                    ? 304 === e.status
                      ? xe.push("/login")
                      : alert(e.message)
                    : kt(e);
                });
              },
              fetchOrgTransactions: Tt,
              createTransaction: function (e, t, n, i) {
                S(
                  {
                    user_id: e,
                    amount: t,
                    task_ids: i,
                    transaction_type: "request",
                  },
                  "transaction/create_transaction"
                ).then(function (e) {
                  200 !== e.status
                    ? 304 === e.status
                      ? xe.push("/login")
                      : alert(e.message)
                    : Tt();
                });
              },
              deleteTransaction: function (e, t) {
                S(
                  { transaction_id: e, transaction_type: t },
                  "transaction/delete_transaction"
                ).then(function (e) {
                  200 !== e.status
                    ? 304 === e.status
                      ? xe.push("/login")
                      : alert(e.message)
                    : Tt();
                });
              },
              processPayRequest: function (e, t, n, i, a, c) {
                S(
                  {
                    request_id: e,
                    user_id: t,
                    request_amount: n,
                    task_ids: i,
                    payoneer_id: a,
                    notes: c,
                  },
                  "transaction/process_payment_request"
                ).then(function (e) {
                  if (200 === e.status) return alert(e.message), void Tt();
                  304 === e.status ? xe.push("/login") : alert(e.message);
                });
              },
              submitPayRequest: function (e) {
                S({ notes: e }, "transaction/submit_payment_request").then(
                  function (e) {
                    if (200 === e.status) return alert(e.message), void Et();
                    304 === e.status ? xe.push("/login") : alert(e.message);
                  }
                );
              },
              fetchUserPayable: function (e) {
                k("transaction/fetch_user_payable").then(function (t) {
                  200 !== t.status
                    ? 304 === t.status
                      ? xe.push("/login")
                      : alert(t.message)
                    : e(t.payable_total);
                });
              },
              fetchUserTransactions: Et,
              update_user_tasks: function (e) {
                k("task/update_user_tasks").then(function (e) {
                  200 !== e.status &&
                    (304 === e.status ? xe.push("/login") : alert(e.message));
                });
              },
              admin_update_all_user_tasks: function (e) {
                k("task/admin_update_all_user_tasks").then(function (e) {
                  200 !== e.status &&
                    (304 === e.status ? xe.push("/login") : alert(e.message));
                });
              },
              checkUserStats: function () {
                k("project/TM4_payment_call").then(function (e) {
                  200 !== e.status &&
                    (304 === e.status ? xe.push("/login") : alert(e.message));
                });
              },
              generateRandomKey: function () {
                return Math.random().toString(36).substr(2, 9);
              },
              findObjectById: function (e, t) {
                return e.find(function (e) {
                  return e.id === t;
                });
              },
              goToSource: function (e) {
                var t;
                null === (t = window.open(e, "_blank")) ||
                  void 0 === t ||
                  t.focus();
              },
              isValidEmail: function (e) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
              },
            };
          return Lt
            ? Object(u.jsx)(ye.Provider, { value: Lt, children: t })
            : null;
        },
        Se = n(8),
        _e = n(38),
        ke = ["children", "role", "admin"],
        Ae = function (e) {
          var t = e.children,
            n = (e.role, e.admin),
            i = Object(_e.a)(e, ke),
            c = Object(a.useContext)(m).user,
            s = function () {
              return c;
            };
          return Object(u.jsx)(
            j.b,
            Object(Se.a)(
              Object(Se.a)({}, i),
              {},
              {
                render: function (e) {
                  var i = e.location;
                  return !s() || (n && "admin" !== c.role)
                    ? Object(u.jsx)(j.a, {
                        to: {
                          pathname: s() ? "/dashboard" : "/login",
                          state: { from: i },
                        },
                      })
                    : t;
                },
              }
            )
          );
        },
        Ce = n(5),
        Pe = n(7),
        De = n.p + "static/media/25.1d89ed52.svg",
        Re = Object(Pe.c)(
          P ||
            (P = Object(Ce.a)([
              "\n  from {\n    transform: rotate(0deg);\n  }\n  to {\n    transform: rotate(360deg);\n  }\n",
            ]))
        ),
        Te = Pe.b.img.attrs({ src: De })(
          D ||
            (D = Object(Ce.a)([
              "\n  //   animation: ",
              " 1s linear infinite;\n  //   transform: translateZ(0);\n\n  background: transparent;\n  top: 50%;\n  left: 50%;\n  transform: translate(-50%, -50%);\n  position: absolute;\n",
            ])),
          Re
        ),
        Ee = function () {
          return Object(u.jsx)(Te, {
            style: {
              position: "relative",
              left: "7px",
              top: "11px",
              width: "25%",
            },
          });
        },
        Ie = Pe.b.div(
          R ||
            (R = Object(Ce.a)([
              "\n  font-size: 16px;\n  line-height: 2;\n  max-width: 700px;\n  width: 100%;\n  text-align: center;\n",
            ]))
        ),
        Le = Pe.b.button(
          T ||
            (T = Object(Ce.a)([
              "\n  margin: 15px 0px;\n  margin-right: 10px;\n  width: 25%;\n  background-color: #2c3f46;\n\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  &:hover {\n    background-color: #91a5ac;\n  }\n",
            ]))
        ),
        Be = Pe.b.button(
          E ||
            (E = Object(Ce.a)([
              "\n  margin: 15px 0px;\n  margin-right: 10px;\n  width: 25%;\n  background-color: #2c3f46;\n\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  &:hover {\n    background-color: #91a5ac;\n  }\n",
            ]))
        ),
        Ue = function (e) {
          var t = Object(a.useState)(!1),
            n = Object(o.a)(t, 2),
            i = n[0],
            c = n[1];
          return Object(u.jsxs)(u.Fragment, {
            children: [
              Object(u.jsxs)(Ie, {
                children: [
                  Object(u.jsx)(Le, {
                    onClick: function () {
                      return c(!0);
                    },
                    children: "Register as user",
                  }),
                  Object(u.jsx)(Be, {
                    onClick: function () {
                      return window.open(
                        "http://my.kaart.com/register?method=admin&integrations=".concat(
                          e.integrations
                        ),
                        "_blank",
                        "width=720, height=800"
                      );
                    },
                    children: "Register as admin",
                  }),
                ],
              }),
              Object(u.jsx)("button", {
                style: {
                  display: "inline-block",
                  position: "relative",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                  border: 0,
                  paddingLeft: "0.25rem",
                  color: "#4183c4",
                  textDecoration: "none",
                },
                onClick: function () {
                  return window.open(
                    "https://my.kaart.com/password-reset",
                    "_blank",
                    "width=800, height=600"
                  );
                },
                children: "Forgot password?",
              }),
              i
                ? Object(u.jsx)(j.a, { push: !0, to: "/registerUser" })
                : Object(u.jsx)(u.Fragment, {}),
            ],
          });
        },
        Me = n.p + "static/media/20-KAART-Color.e9de1cd3.svg",
        Fe = Pe.b.div(
          I ||
            (I = Object(Ce.a)([
              "\n  width: 100vw;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  transition: all 0.4s ease;\n\n  ",
              "\n",
            ])),
          function (e) {
            return e.modalShown
              ? "filter: blur(10px) grayscale(50%);\n  -webkit-filter: blur(10px) grayscale(50%);\n  -webkit-transform: scale(0.9);\n  pointer-events: none;"
              : "";
          }
        ),
        Ye = Pe.b.form(
          L ||
            (L = Object(Ce.a)([
              "\n  font-size: 16px;\n  line-height: 2;\n  max-width: 450px;\n  width: 100%;\n  text-align: center;\n",
            ]))
        ),
        Ne = Pe.b.img(
          B ||
            (B = Object(Ce.a)([
              "\n  height: 35vh;\n  margin-left: auto;\n  margin-right: auto;\n  display: block;\n",
            ]))
        ),
        qe =
          (Pe.b.h1(
            U ||
              (U = Object(Ce.a)([
                "\n  text-align: center;\n  font-size: 56px;\n",
              ]))
          ),
          Pe.b.input(
            M ||
              (M = Object(Ce.a)([
                "\n  width: 80%;\n  padding: 12px 20px;\n  margin: 8px 0;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  box-sizing: border-box;\n",
              ]))
          )),
        ze = Pe.b.button(
          F ||
            (F = Object(Ce.a)([
              "\n  margin: 15px 0px;\n  margin-right: 10px;\n  width: 25%;\n  background-color: #f4753c;\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  &:hover {\n    background-color: #c85823;\n  }\n",
            ]))
        ),
        Ke = function () {
          var e = Object(a.useState)(""),
            t = Object(o.a)(e, 2),
            n = t[0],
            i = t[1],
            c = Object(a.useState)(""),
            s = Object(o.a)(c, 2),
            r = s[0],
            l = s[1],
            d = Object(a.useState)(!1),
            b = Object(o.a)(d, 2),
            x = b[0],
            O = b[1],
            p = Object(a.useContext)(ye),
            v = p.fetching,
            y = p.setFetching,
            w = p.history,
            S = Object(a.useContext)(m).setUser;
          return Object(u.jsxs)(u.Fragment, {
            children: [
              Object(u.jsxs)(Fe, {
                children: [
                  Object(u.jsxs)(Ye, {
                    onSubmit: function (e) {
                      e.preventDefault(),
                        fetch(g.concat("auth/login"), {
                          method: "POST",
                          mode: "cors",
                          credentials: "include",
                          headers: {
                            "Access-Control-Allow-Origin": "*",
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({ email: n, password: r }),
                        })
                          .then(function (e) {
                            if (!e.ok) throw e;
                            return e;
                          })
                          .then(function () {
                            !(function () {
                              var e,
                                t,
                                n,
                                i,
                                a = h.concat("login");
                              fetch(a, {
                                method: "post",
                                mode: "cors",
                                credentials: "include",
                                headers: {
                                  "X-CSRF-TOKEN": "".concat(
                                    f.a.get("csrf_access_token")
                                  ),
                                },
                              })
                                .then(function (e) {
                                  if (!e.ok) throw e;
                                  return e.json();
                                })
                                .then(function (a) {
                                  y(!1),
                                    (e = a.osm_username),
                                    (t = a.payment_email),
                                    (i = a.city),
                                    (n = a.country),
                                    S(a),
                                    (Y = a.role);
                                })
                                .then(function () {
                                  e && t && i && n
                                    ? w.push(
                                        "admin" === Y
                                          ? "/admindash"
                                          : "/dashboard"
                                      )
                                    : O(!0);
                                });
                            })();
                          });
                    },
                    children: [
                      Object(u.jsx)(Ne, { src: Me, alt: "Kaart Logo" }),
                      Object(u.jsx)(qe, {
                        name: "email",
                        type: "text",
                        autoComplete: "username",
                        placeholder: "Enter your email",
                        value: n,
                        onChange: function (e) {
                          i(e.target.value);
                        },
                      }),
                      Object(u.jsx)(qe, {
                        name: "password",
                        type: "password",
                        autoComplete: "current-password",
                        placeholder: "Enter your password",
                        value: r,
                        onChange: function (e) {
                          l(e.target.value);
                        },
                      }),
                      Object(u.jsx)(ze, {
                        type: "submit",
                        children: v ? Object(u.jsx)(Ee, {}) : "Login",
                      }),
                    ],
                  }),
                  Object(u.jsx)("div", {
                    children:
                      "---------------------- or ----------------------",
                  }),
                  Object(u.jsx)(Ue, { integrations: "mikro" }),
                ],
              }),
              x
                ? Object(u.jsx)(j.a, { push: !0, to: "/welcome" })
                : Object(u.jsx)(u.Fragment, {}),
            ],
          });
        },
        Ve = n(24),
        He = n.p + "static/media/users_icon.bc089ee5.png",
        We = n.p + "static/media/payments_icon.24f38677.png",
        Qe = n.p + "static/media/account_icon.b47a1afd.png",
        Ge = n.p + "static/media/5.7b3d84fd.png",
        Je = n(74),
        Xe = n(9),
        Ze =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAC4AAAAuCAYAAABXuSs3AAAACXBIWXMAAC4jAAAuIwF4pT92AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAA31JREFUaIHN2UtPE1EUwPH/aVEUNBF2gF/FxNfCREUTLfIUo3RqTExE/QD9AoCJiUoxIshDeagBdGWMX8KVGxY+dhrjIyGxHBeUYVo6d96Fs+vk3HN/ub2dOdMLjtAsFzTLjOapY5eEZkirxaRm6XFeT9kJOS4izCJ08YXZ3YDXDGmamAT6ECaceIESWpkB9myNYoE2uiTPv5qLKUN3Oy4XUfpljGlRiwwwA1VXeJ5WumuNd0FvRhHhSgrhHNXRABm+MKkZ0skxy0Pz1NHMDNXRAGngVIrv9CNMu1YSumiuzQ9WM6T5ygRKhyFtnhauiD3A/avZCGGOFnqS2ja+DI6tK4EGJoQPit6gVBY4xDOELtfhMePDoDcY1Qp54eEFrfRGxYdFQxW4XTBhfBQ0uMAdhaeATkPh5/ygV+Yp+ieXajczgZY/xivC+AxxhdsTxIyPAw2OXqValDCXEV4Z0jpp5rHmzbUgPjR4rLg9ocUeYA44b6j0lBauSZ710OgA/ZEvOPjEwzitDFTi40ZDADiEwyeBhoDwEmQvh5grNWdu8YRWsnxEkkBDCDj4xo8D9Zju0xF6/lBwKOGbmAfawxWI9qISGg4R8DG8XUWCQwh8TK+EkeFg7/lFhDPmRBZpozOOztLzaeczisAvzyzhJ1R/QAWNyHD7Pm3uJDfjKl8Z9dMeeEWkAj57j8oY4BuPNOI2jXI7DIN2zjzGKDkBDTM81Ir7Qq/zEuGNexGy5BgNu/KB4b57j8NcYi8XwANvhds2wZqsEA2T3qSeNRaB04bSBQpcD7JtfK942C5P7rNGvcfKg4XFwyAr7wsetTWV+6zRSAZ4Z5gmR44Rv3jPpDj7aR1kP39YAk4a0u5JgUEvl/fLcsz9dAm/DJwwpHnizX9PJPQSoBYNwBIR8FX3eJJoACnwF2hHeG9Iu6UWw641tnkSRpeVsWhAWEY5bkgbkQK3Ky+WrXgt0VBaeeWsx8oPapahbWNtT43RZWU39vwKcMww97CMcWfz49Yf+zuEtssHxMtuQNvT+MHDkBS4K5pjyohO+AilMvQGByjyFuWIIe1uCngNLihloZZoAHnAb5RTKB9cUlZJseg8oJ3FeWy40we0fTSyjxWEo47Lq6Q4Jo9Y3bqrOE+Xdxhtm8rxn1jnuDzm8/bELB1qMb0bzvE3Q69yUC0m9Tptzuv/AW9N0A8R3YSTAAAAAElFTkSuQmCC",
        $e = Pe.b.div(
          N ||
            (N = Object(Ce.a)([
              "\n  display: flex;\n  justify-content: space-evenly;\n  gap: 1rem;\n  margin: 1rem;\n",
            ]))
        ),
        et = Pe.b.div(
          q ||
            (q = Object(Ce.a)([
              "\n  color: white;\n  text-transform: capitalize;\n  background-color: #253e45;\n  width: 8rem;\n  margin-right: 1vw;\n  height: 4vh;\n  border-radius: 6px;\n  padding: 1px 1px;\n  &:hover {\n    cursor: pointer;\n    background-color: #91a5ac;\n  }\n",
            ]))
        ),
        tt = Pe.b.div(z || (z = Object(Ce.a)(["\n  margin: 2px;\n"]))),
        nt =
          (Pe.b.button(
            K ||
              (K = Object(Ce.a)([
                "\n  margin: 15px 0px;\n  margin-right: 10px;\n  width: 50%;\n  background-color: #f4753c;\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  &:hover {\n    background-color: #c85823;\n  }\n",
              ]))
          ),
          Pe.b.img(
            V ||
              (V = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  position: relative;\n  left: 95%;\n  width: 2%;\n  background-repeat: no-repeat;\n  background-position: 50%;\n",
              ])),
            Ze
          ),
          Pe.b.input(
            H ||
              (H = Object(Ce.a)([
                "\n  box-sizing: inherit;\n  font-family: sans-serif;\n  font-size: 100%;\n  line-height: 1.15;\n  overflow: visible;\n  width: 90%;\n  display: flex;\n  align-self: center;\n  padding: 12px 20px;\n  margin: 8px 0;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n",
              ]))
          ),
          Pe.b.textarea(
            W ||
              (W = Object(Ce.a)([
                "\n  font-family: sans-serif;\n  font-size: 100%;\n  line-height: 1.15;\n  overflow: visible;\n  width: 90%;\n  display: flex;\n  align-self: center;\n  padding: 12px 20px;\n  height: 75%;\n  resize: none;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  box-sizing: border-box;\n",
              ]))
          ),
          n(267)),
        it = n(268),
        at = n(252),
        ct = n(269),
        st = n(270),
        rt = n(271),
        ot = n(263),
        lt = n(259),
        jt = n(272),
        dt = n(273),
        ut = n(258),
        bt =
          (Object(Xe.a)("div")(function (e) {
            e.theme;
            return { display: "flex", flexDirection: "row" };
          }),
          Object(Xe.a)("div")(function (e) {
            e.theme;
            return {
              display: "flex",
              position: "relative",
              justifyContent: "center",
              paddingTop: "3vh",
              "&:before": {
                top: 0,
                zIndex: 9,
                content: "''",
                width: "100%",
                height: "100%",
                position: "absolute",
                backdropFilter: "blur(3px)",
                WebkitBackdropFilter: "blur(3px)",
                backgroundColor: "#f4753c",
                fontWeight: "400",
              },
            };
          })),
        xt = Object(Xe.a)(nt.a)(function () {
          return { width: "100%", marginLeft: "0vw" };
        }),
        ht =
          (Object(Xe.a)("div")(function (e) {
            e.theme;
            return {
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            };
          }),
          Object(Xe.a)("div")(function () {
            return {
              position: "fixed",
              top: "50%",
              left: "55%",
              backgroundColor: "white",
              backdropFilter: "blur(3px)",
              WebkitBackdropFilter: "blur(3px)",
              borderRadius: "6px",
              width: "50%",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
              transform: "translate(-50%, -50%)",
            };
          })),
        gt = Object(Xe.a)("div")(function (e) {
          e.theme;
          return {
            display: "flex",
            flexDirection: "row",
            textAlign: "center",
            justifyContent: "center",
          };
        }),
        Ot = Object(Xe.a)(it.a)(function () {
          return { width: "100%", marginLeft: "2vw" };
        }),
        pt = [
          { id: "name", label: "Name", alignLeft: !0 },
          { id: "Rate", label: "Rate", alignLeft: !0 },
          { id: "Tasks", label: "Tasks", alignLeft: !0 },
          { id: "Difficulty", label: "Difficulty", alignLeft: !0 },
          { id: "Budget", label: "Budget", alignLeft: !0 },
          { id: "Current Payout", label: "Current Payout", alignLeft: !0 },
          { id: "Validated/Mapped", label: "Validated/Mapped", alignLeft: !0 },
          { id: "Invalidated", label: "Invalidated", alignLeft: !0 },
        ],
        ft = [
          { id: "name", label: "Username", alignRight: !1 },
          { id: "role", label: "Role", alignRight: !1 },
          {
            id: "assinged projects",
            label: "Assinged Projects",
            alignRight: !1,
          },
          { id: "tasks Mapped", label: "Tasks Mapped", alignRight: !1 },
          { id: "tasks validated", label: "Tasks Validated", alignRight: !1 },
          {
            id: "tasks invalidated",
            label: "Tasks Invalidated",
            alignRight: !1,
          },
          { id: "awaiting payment", label: "Awaiting Payment", alignRight: !1 },
          { id: "total payout", label: "Total Payout", alignRight: !1 },
        ],
        mt = [
          { id: "name", label: "Username", alignRight: !1 },
          { id: "role", label: "Role", alignRight: !1 },
          {
            id: "Currently assigned",
            label: "Currently Assigned",
            alignRight: !1,
          },
          { id: "Total Projects", label: "Total Projects", alignRight: !1 },
        ],
        vt = [
          { id: "name", label: "User", alignRight: !1 },
          { id: "Request ID", label: "Request ID", alignRight: !1 },
          { id: "Amount Requested", label: "Amount Requested", alignRight: !1 },
          { id: "Date Requested", label: "Date Requested", alignRight: !1 },
        ],
        yt = function (e) {
          return Object(u.jsx)(u.Fragment, {
            children: Object(u.jsxs)(nt.a, {
              style: {
                boxShadow: "1px 1px 6px 2px gray",
                position: "relative",
                top: "2vh",
                marginLeft: "3.5vw",
                marginRight: "5.3vw",
                marginBottom: "1vh",
                width: "20vw",
                height: "40vh",
                display: "flex",
                flexDirection: "column",
              },
              children: [
                Object(u.jsx)(bt, {}),
                Object(u.jsx)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: Object(u.jsx)(kt, { title_text: e.title }),
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: "4vh",
                  },
                  children: [
                    Object(u.jsx)(kt, { title_text: e.subtitle_text_1 }),
                    Object(u.jsx)(kt, { title_text: e.value_1 }),
                  ],
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: "4vh",
                  },
                  children: [
                    Object(u.jsx)(kt, { title_text: e.subtitle_text_2 }),
                    Object(u.jsx)(kt, { title_text: e.value_2 }),
                  ],
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    marginBottom: "1vh",
                  },
                  children: [
                    Object(u.jsx)(kt, { title_text: e.subtitle_text_3 }),
                    Object(u.jsx)(kt, { title_text: e.value_3 }),
                  ],
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsx)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                }),
              ],
            }),
          });
        },
        wt = function (e) {
          return Object(u.jsx)(ct.a, {
            align: "left",
            component: "th",
            scope: "row",
            children: Object(u.jsx)(st.a, {
              variant: "subtitle2",
              noWrap: !0,
              style: { textAlign: "center" },
              children: e.entry,
            }),
          });
        },
        St = function (e) {
          return Object(u.jsx)(et, {
            onClick: e.cancel_action,
            style: { boxShadow: "1px 1px 6px 2px gray" },
            children: e.cancel_text,
          });
        },
        _t = function (e) {
          return Object(u.jsx)(et, {
            onClick: function (t) {
              return e.confirm_action(t);
            },
            style: { boxShadow: "1px 1px 6px 2px gray" },
            children: e.confirm_text,
          });
        },
        kt = function (e) {
          return Object(u.jsx)(st.a, {
            variant: "h5",
            align: "center",
            style: {
              paddingLeft: "1vw",
              paddingRight: "1vw",
              marginBottom: "1vh",
              marginTop: "2vh",
            },
            sx: { mt: 6 },
            children: e.title_text,
          });
        },
        At = function (e) {
          return Object(u.jsx)(st.a, {
            variant: "body1",
            align: "center",
            style: {
              paddingLeft: "1vw",
              paddingRight: "1vw",
              marginBottom: "1vh",
              marginTop: "1vh",
            },
            sx: { mt: 6 },
            children: e.subtitle_text,
          });
        },
        Ct = function (e) {
          return Object(u.jsx)("img", {
            src: Ze,
            style: { position: "relative", left: "95%", width: "2%" },
            alt: "close_button",
            onClick: e.close_action,
          });
        },
        Pt = function (e) {
          return Object(u.jsx)(et, {
            onClick: e.button_action,
            style: { boxShadow: "1px 1px 6px 2px gray", textAlign: "center" },
            children: Object(u.jsx)(tt, { children: e.button_text }),
          });
        },
        Dt = function (e) {
          return Object(u.jsxs)($e, {
            children: [
              e.csv
                ? Object(u.jsx)(Je.CSVLink, {
                    data: e.data,
                    filename: "payment-report.csv",
                    style: { textDecoration: "none" },
                    children: Object(u.jsx)(Pt, {
                      button_action: e.button1_action,
                      button_text: e.button1_text,
                    }),
                  })
                : Object(u.jsx)(u.Fragment, {}),
              e.button1
                ? Object(u.jsx)(Pt, {
                    button_action: e.button1_action,
                    button_text: e.button1_text,
                  })
                : Object(u.jsx)(u.Fragment, {}),
              e.button2
                ? Object(u.jsx)(Pt, {
                    button_action: e.button2_action,
                    button_text: e.button2_text,
                  })
                : Object(u.jsx)(u.Fragment, {}),
              e.button3
                ? Object(u.jsx)(Pt, {
                    button_action: e.button3_action,
                    button_text: e.button3_text,
                  })
                : Object(u.jsx)(u.Fragment, {}),
            ],
          });
        },
        Rt = function (e) {
          return Object(u.jsx)(rt.a, {
            children: Object(u.jsx)(it.a, {
              style: { margin: "0", textAlign: "center" },
              children: e.headLabel.map(function (t) {
                return Object(u.jsx)(
                  ct.a,
                  {
                    style: {
                      width: "10vw",
                      textAlign: "center",
                      fontSize: e.fontSize,
                    },
                    children: Object(u.jsx)(ot.a, {
                      direction: !0 === e.operator ? "desc" : "asc",
                      onClick: function (n) {
                        return e.sortOrgProjects(t.label, "asc");
                      },
                      children: t.label,
                    }),
                  },
                  t.id
                );
              }),
            }),
          });
        },
        Tt = function (e) {
          return Object(u.jsxs)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              textAlign: "center",
              justifyContent: "center",
            },
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.cancel_action,
                cancel_text: e.cancel_text,
              }),
              Object(u.jsx)(_t, {
                confirm_action: e.confirm_action,
                confirm_text: e.confirm_text,
              }),
            ],
          });
        },
        Et = function (e) {
          var t = Object(u.jsx)(ht, {
            children: Object(u.jsxs)(nt.a, {
              children: [
                Object(u.jsx)(st.a, {
                  variant: "h5",
                  align: "center",
                  style: { marginLeft: "1vw", marginRight: "1vw" },
                  children: e.interrogative,
                }),
                Object(u.jsx)(at.a, { style: { marginTop: "1vh" } }),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    alignItems: "center",
                  },
                  children: [
                    Object(u.jsx)(et, {
                      style: { marginLeft: "1vw", marginRight: "1vw" },
                      onClick: function () {
                        return e.button_1_action();
                      },
                      children: e.button_1_text,
                    }),
                    Object(u.jsx)(et, {
                      style: { marginLeft: "1vw", marginRight: "1vw" },
                      onClick: function () {
                        return e.button_2_action();
                      },
                      children: e.button_2_text,
                    }),
                  ],
                }),
              ],
            }),
          });
          return Object(u.jsx)(lt.a, {
            open: e.modal_open,
            onClose: e.handleOpenCloseModal,
            "aria-labelledby": "simple-modal-title",
            "aria-describedby": "simple-modal-description",
            children: t,
          });
        },
        It = function (e) {
          return Object(u.jsx)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              marginLeft: "3.5vw",
              height: "78vh",
              width: "77.5vw",
            },
            children: Object(u.jsxs)(xt, {
              style: { boxShadow: "1px 1px 6px 2px gray" },
              children: [
                Object(u.jsx)(bt, {}),
                Object(u.jsxs)(jt.a, {
                  children: [
                    Object(u.jsx)(Rt, { headLabel: vt }),
                    Object(u.jsx)(dt.a, {
                      children:
                        e.orgRequests &&
                        e.orgRequests
                          .slice(
                            e.page * e.rowsPerPage,
                            e.page * e.rowsPerPage + e.rowsPerPage
                          )
                          .map(function (t) {
                            var n = t.id,
                              i = t.payment_email,
                              a = t.user,
                              c = t.user_id,
                              s = t.amount_requested,
                              r = t.task_ids,
                              o = t.date_requested;
                            return Object(u.jsxs)(
                              Ot,
                              {
                                sx: {
                                  "&:hover": {
                                    backgroundColor: "rgba(145, 165, 172, 0.5)",
                                    cursor: "pointer",
                                  },
                                },
                                align: "center",
                                tabIndex: -1,
                                onClick: function () {
                                  return e.handleSetRequestSelected(
                                    n,
                                    a,
                                    c,
                                    s,
                                    o,
                                    i,
                                    r
                                  );
                                },
                                selected: e.requestSelected === n,
                                children: [
                                  Object(u.jsx)(wt, { entry: a }),
                                  Object(u.jsx)(wt, { entry: n }),
                                  Object(u.jsx)(wt, { entry: s }),
                                  Object(u.jsx)(wt, { entry: o }),
                                ],
                              },
                              t
                            );
                          }),
                    }),
                  ],
                }),
                Object(u.jsx)(ut.a, {
                  style: { width: "auto" },
                  rowsPerPageOptions: [5, 10, 15],
                  component: "div",
                  count: e.pay_requests ? e.pay_requests.length : 5,
                  rowsPerPage: e.rowsPerPage,
                  page: e.page,
                  onPageChange: function (t, n) {
                    return e.setPage(n);
                  },
                  onRowsPerPageChange: function (t) {
                    return e.handleChangeRowsPerPage(t);
                  },
                }),
              ],
            }),
          });
        },
        Lt = function (e) {
          return Object(u.jsx)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              marginLeft: "3.5vw",
              height: "78vh",
              width: "77.5vw",
            },
            children: Object(u.jsxs)(xt, {
              style: { boxShadow: "1px 1px 6px 2px gray" },
              children: [
                Object(u.jsx)(bt, {}),
                Object(u.jsxs)(jt.a, {
                  children: [
                    Object(u.jsx)(Rt, { headLabel: vt }),
                    Object(u.jsx)(dt.a, {
                      children:
                        e.orgPayments &&
                        e.orgPayments
                          .slice(
                            e.page * e.rowsPerPage,
                            e.page * e.rowsPerPage + e.rowsPerPage
                          )
                          .map(function (t) {
                            var n = t.id,
                              i = t.payment_email,
                              a = t.user,
                              c = t.user_id,
                              s = t.amount_paid,
                              r = t.task_ids,
                              o = t.date_paid,
                              l = t.payoneer_id;
                            return Object(u.jsxs)(
                              Ot,
                              {
                                sx: {
                                  "&:hover": {
                                    backgroundColor: "rgba(145, 165, 172, 0.5)",
                                    cursor: "pointer",
                                  },
                                },
                                align: "center",
                                tabIndex: -1,
                                onClick: function () {
                                  return e.handleSetPaymentSelected(
                                    n,
                                    a,
                                    c,
                                    s,
                                    o,
                                    i,
                                    r,
                                    l
                                  );
                                },
                                selected: e.paymentSelected === n,
                                children: [
                                  Object(u.jsx)(wt, { entry: a }),
                                  Object(u.jsx)(wt, { entry: n }),
                                  Object(u.jsx)(wt, { entry: "$".concat(s) }),
                                  Object(u.jsx)(wt, { entry: o }),
                                ],
                              },
                              t
                            );
                          }),
                    }),
                  ],
                }),
                Object(u.jsx)(ut.a, {
                  style: { width: "auto" },
                  rowsPerPageOptions: [5, 10, 15],
                  component: "div",
                  count: e.pay_requests ? e.pay_requests.length : 5,
                  rowsPerPage: e.rowsPerPage,
                  page: e.page,
                  onPageChange: function (t, n) {
                    return e.setPage(n);
                  },
                  onRowsPerPageChange: function (t) {
                    return e.handleChangeRowsPerPage(t);
                  },
                }),
              ],
            }),
          });
        },
        Bt = (n(177), n.p + "static/media/20-KAART-White.e05880a7.svg"),
        Ut = n.p + "static/media/close-icon.4096f55d.svg",
        Mt = n.p + "static/media/logo-kaart-standard.b009d971.svg",
        Ft =
          "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAANUlEQVRIie3TsQ0AIAwDwYj9t8pgoWIApJCGuwVeLhwBdKuqrPfy9Nb0vuEeX3MnaONOwK0NKrA4cwLOQUAAAAAASUVORK5CYII=",
        Yt = Pe.b.div(
          Q ||
            (Q = Object(Ce.a)([
              "\n  border-width: 0px;\n  z-index: 9999;\n  position: absolute;\n  box-shadow: 3px 0px 5px #253e45;\n  left: 0;\n  height: 100%;\n  width: 220px;\n  transition: left 0.3s ease-in-out;\n  background-color: white;\n",
            ]))
        ),
        Nt = Pe.b.div(
          G ||
            (G = Object(Ce.a)([
              "\n  border-width: 0px;\n  z-index: 9999;\n  position: absolute;\n  left: 0;\n  height: 100%;\n  width: 15vw;\n  transition: left 0.3s ease-in-out;\n  background-color: transparent;\n",
            ]))
        ),
        qt = Pe.b.a(
          J ||
            (J = Object(Ce.a)([
              "\n  position: relative;\n  color: #253e45 !important;\n  padding-left: 4rem;\n  padding: 1rem;\n  display: block;\n  text-decoration: none;\n  box-sizing: border-box;\n  &:hover {\n    cursor: pointer;\n    background: rgba(145, 165, 172, 0.1);\n  }\n",
            ]))
        ),
        zt = Pe.b.div(
          X ||
            (X = Object(Ce.a)([
              "\n  display: flex;\n  align-items: center;\n  &:hover {\n    cursor: pointer;\n  }\n",
            ]))
        ),
        Kt =
          (Pe.b.div(
            Z ||
              (Z = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  background-repeat: no-repeat;\n  background-position: 50%;\n  max-width: 100%;\n  width: 100px;\n  height: 80px;\n  /* position: relative; */\n  &:hover {\n    cursor: pointer;\n  }\n",
              ])),
            Mt
          ),
          Pe.b.div(
            $ ||
              ($ = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  background-repeat: no-repeat;\n  background-position: 50%;\n  max-width: 100%;\n  width: 100px;\n  height: 80px;\n  position: relative;\n  &:hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n",
              ])),
            Bt
          ),
          Pe.b.span(
            ee ||
              (ee = Object(Ce.a)([
                "\n  border-radius: 50%;\n  height: 16px;\n  width: 16px;\n  text-align: center;\n  box-sizing: border-box;\n  font-size: var(--h3);\n",
              ]))
          )),
        Vt = Pe.b.img(
          te || (te = Object(Ce.a)(["\n  width: 35px;\n  height: 35px;\n"]))
        ),
        Ht =
          (Pe.b.div(
            ne ||
              (ne = Object(Ce.a)([
                "\n  top: 1.5%;\n  right: 20px;\n  position: absolute;\n  height: 66px;\n  width: 32px;\n  pointer-events: none;\n  z-index: 999;\n",
              ]))
          ),
          Pe.b.div(
            ie ||
              (ie = Object(Ce.a)([
                "\n  border-radius: 25px;\n  width: 75%;\n  height: 25px;\n  pointer-events: auto;\n  background: rgba(145, 165, 172, 0.3);\n  cursor: pointer;\n",
              ]))
          ),
          Pe.b.div(
            ae ||
              (ae = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  position: relative;\n  top: 0;\n  left: 0;\n  background-size: contain;\n  background-repeat: no-repeat;\n  opacity: 1;\n  width: 24px;\n  height: 24px;\n  &:hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n",
              ])),
            Ft
          ),
          Pe.b.div(
            ce ||
              (ce = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  background-repeat: no-repeat;\n  background-size: 20px 20px;\n  position: absolute;\n  left: 14rem;\n  width: 13%;\n  height: 3rem;\n  top: 15px;\n  &:hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n",
              ])),
            Ut
          )),
        Wt = Pe.b.a(
          se ||
            (se = Object(Ce.a)([
              "\n  text-align: left;\n  margin-left: 1.2vw;\n  color: #253e45 !important;\n  text-decoration: none;\n  font-size: 15px;\n  font-weight: 500;\n  background-color: transparent !important;\n  border-right: none !important;\n",
            ]))
        ),
        Qt = Pe.b.div(
          re ||
            (re = Object(Ce.a)([
              "\n  /* padding-top: 0.5vw; */\n  text-align: center;\n  margin: auto;\n  margin-top: 1rem;\n  margin-bottom: 1rem;\n  height: 4rem;\n  width: 16rem;\n  // background: rgba(145, 165, 172, 0.2);\n  border-radius: 6px;\n",
            ]))
        ),
        Gt = Pe.b.h6(
          oe ||
            (oe = Object(Ce.a)([
              "\n  /* text-align: center; */\n  /* font-size: 1.1rem; */\n  padding-top: 5px;\n  color: #253e45;\n  font-weight: 700;\n",
            ]))
        ),
        Jt = Pe.b.h6(
          le ||
            (le = Object(Ce.a)([
              "\n  /* text-align: center; */\n  color: #253e45;\n  opacity: 0.7;\n",
            ]))
        ),
        Xt = "https://kaart.com/dev/mikro/",
        Zt =
          (Pe.b.li(
            je ||
              (je = Object(Ce.a)([
                "\n  margin-right: 6%;\n  color: #9095a4;\n\n  ",
                "\n",
              ])),
            function (e) {
              return (
                e.activeTab &&
                Object(Pe.a)(
                  de ||
                    (de = Object(Ce.a)([
                      '\n      color: #0095ff;\n\n      ::after {\n        content: "";\n        position: relative;\n        height: 5px;\n        margin-top: 0.5rem;\n        border-radius: 5px 5px 0 0;\n        background-color: #0095ff;\n        display: block;\n      }\n    ',
                    ]))
                )
              );
            }
          ),
          Pe.b.ul(
            ue ||
              (ue = Object(Ce.a)([
                "\n  display: flex;\n  list-style-type: none;\n  float: right;\n  flex-direction: row;\n  border-bottom: 1px solid lightgray;\n  width: 100%;\n",
              ]))
          ),
          function (e) {
            var t = Object(a.useState)(""),
              n = Object(o.a)(t, 2),
              i = n[0],
              c = n[1],
              s = Object(a.useState)(""),
              r = Object(o.a)(s, 2),
              l = r[0],
              j = r[1],
              d = Object(a.useState)("/dashboard"),
              b = Object(o.a)(d, 2),
              x = b[0],
              h = b[1],
              p = Object(a.useState)("/UserProjectsPage"),
              f = Object(o.a)(p, 2),
              v = f[0],
              y = f[1],
              w = Object(a.useState)("/UserAccountPage"),
              S = Object(o.a)(w, 2),
              _ = S[0],
              k = S[1],
              A = Object(a.useState)("/UserPaymentsPage"),
              C = Object(o.a)(A, 2),
              P = C[0],
              D = C[1],
              R = Object(a.useState)("/UserTrainingPage"),
              T = Object(o.a)(R, 2),
              E = T[0],
              I = T[1],
              L = O("mikro.user", null),
              B = Object(o.a)(L, 2),
              U = (B[0], B[1]),
              M = Object(a.useContext)(ye),
              F = M.history,
              Y = M.sidebarOpen,
              N = Object(a.useContext)(m),
              q = N.user,
              z = N.refresh;
            Object(a.useEffect)(function () {
              null === q && F.push("/login"),
                q && z(),
                c(q.role),
                j(q.name),
                "admin" === q.role &&
                  (h("/admindash"),
                  y("/AdminProjectsPage"),
                  k("/AdminAccountPage"),
                  D("/AdminPaymentsPage"),
                  I("/AdminTrainingPage"));
            }, []);
            var K = function () {
              fetch(g.concat("auth/logout"), { method: "POST" }).then(
                function () {
                  U(null), F.push("/login");
                }
              );
            };
            return Object(u.jsx)("div", {
              children: Y
                ? Object(u.jsxs)(Yt, {
                    children: [
                      Object(u.jsx)(Ht, {
                        onClick: e.toggleSidebar,
                        style: { position: "absolute", top: ".5vh" },
                      }),
                      Object(u.jsx)(zt, {
                        children: Object(u.jsx)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            marginTop: "2vh",
                          },
                          children: Object(u.jsx)("div", {
                            style: { marginLeft: ".7vw" },
                          }),
                        }),
                      }),
                      Object(u.jsx)(zt, {
                        children: Object(u.jsxs)(Qt, {
                          children: [
                            Object(u.jsxs)("div", {
                              style: {
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                              },
                              children: [
                                Object(u.jsx)("div", {
                                  style: {
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                  },
                                  children: Object(u.jsx)("img", {
                                    style: {
                                      height: "5vh",
                                      marginLeft: ".8vw",
                                      marginRight: "1vw",
                                    },
                                    src: Ge,
                                    alt: "Kaart Logo",
                                  }),
                                }),
                                Object(u.jsxs)("div", {
                                  style: {
                                    display: "flex",
                                    flexDirection: "column",
                                    alignItems: "center",
                                  },
                                  children: [
                                    Object(u.jsx)(Gt, { children: l }),
                                    Object(u.jsx)(Jt, { children: i }),
                                  ],
                                }),
                              ],
                            }),
                            Object(u.jsx)("div", {
                              style: {
                                width: "100%",
                                backgroundColor: "black",
                                height: ".05vh",
                                marginTop: "2vh",
                              },
                            }),
                          ],
                        }),
                      }),
                      Object(u.jsx)(Ve.b, {
                        to: x,
                        style: { textDecoration: "none" },
                        children: Object(u.jsxs)(qt, {
                          children: [
                            Object(u.jsx)(Kt, {
                              children: Object(u.jsx)(Vt, {
                                src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAABCElEQVRoge3ZMU7CcBTH8e+/NDiZlEMQ1+4khoXVQbkBXsCTeBEvQLoQYUdXewk3Q0z6GLALCWprm/f88z4TQ4ffr695bwCc60W4mtxcyuDjUeAOyLQDNfQugaeL8PmQfpVYaCdqKQvC/a4aSgrcAoQqyd82y1flYI2Mp7Ocim0SZJ4IjAD+WwmAclW8AAiMEu0wXfEi1oTx9Uy0Q3Qhmomk9Y/yuQiaQdqqv6hoJuJFrImmSPrzIwdaa/q3S+j8JmJ9PUczES9ijRexptUdOd5gfd4YvyOnfPdmLNyYaCbiRazxrWWNby1rvIg1vrWs8a1ljRexxotYE9Ffb8JGO8TfyVo7gYvWHoqlWdXnSPHTAAAAAElFTkSuQmCC",
                              }),
                            }),
                            Object(u.jsx)(Wt, { children: "Dashboard" }),
                          ],
                        }),
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                      Object(u.jsx)(Ve.b, {
                        to: v,
                        style: { textDecoration: "none" },
                        children: Object(u.jsxs)(qt, {
                          children: [
                            Object(u.jsx)(Kt, {
                              children: Object(u.jsx)(Vt, {
                                src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAANgAAADhCAYAAACqVXuIAAAACXBIWXMAABuuAAAbrgGMXXP4AAAAGXRFWHRTb2Z0d2FyZQB3d3cuaW5rc2NhcGUub3Jnm+48GgAAEyNJREFUeJzt3XuUnVV5x/FvJhdmcplcgIQg90DLpcq13LS1wEKWXASsRWkpQoHaKu1airRoV7G6ukCXbbVUvFBsacGKoEAXLkEFUbArtbRcKgIJYIhUIBCSmSSTTJK59I/nvJl3Zt7bmbP3u/c58/us9a7Muczez0nOk73f/e537xlMD3OA3saxGFiQejy38Z5eYCYwG5jfeG5+4/HMxus03r9b4+fFOXXNK4mnB+guec+8RlnSvkZmhY7AgV5gBXBw4899gOXA0saxHEsokboNt1uCdQEnAicDJwHHYwklEqO2SbAjgcuA92Atkkg7iD7BDgSuBy4AZgSORaRZUSfYWcCtZA8kSL12AlsqvG8E6K9YZn/j/WW2NOovsw0YrPA+l59lPvChgteHY20VzgbuwUbv8twLPF2hrE74h0yE+iySbW/glwWvr68rkGYcBmwGRguO7wAxt74yPexN8ff01XChZesCHqE46KeAhaECFEkpS7Ci1i2ISykPWMPyEouyBHspXGiTdQNryQ92ALvuJRKLsgRbEy60yd5PfqBDwDnhQhPJVJZgL4QLbbKHyA/0TwPGJZKnLMFWhQttvD2x4eesIG8IGJdIkbIEeyZcaOOdjobjpf2UJdhPu8LFNs6RGc89BVyInX+JtKPhWBPsZeBMqs9wEIlRNAl24ITHNxHZNQSRKRiJJcF0C4p0oqFYEmxZ6ABEPIiiizif8jUsRNpRFAm2V+gARDyJIsH2DB2AiCdRJJhuPZFOFUWC6fxLOpUSTMQjJZiIR1Ek2Pzyt4i0pSgSTC2YdColmIhHSjARj6JIsJ7QAYh4EkWCzQ4dgIgnUSSYNpmTTqUEE/EoigRTF1E6VRQJphZMOpUSTMSjKBJMXUTpVFEkmFow6VRKMBGPokgwdRGlUynBRDwaiWFjhaKNzkOZha0Vsih1LGwcvdhmgTQed2GfobfxXE/q9V6a+3xzmNrk5wXUt0nGELaHdpbNZO8lsAkYTj1ObxCfbOw+iG3KPgr0NV4baDzfB2xM/blx6uHXang6J9hM4ATgGOAtwAHY9rT7optA20GSbOuxrYXXAs8BTzSOgXCh7RJFgtXdTZ0LfAK4HFhSc93iTtKzOBD49QmvDQL3AdcAq2uOKy2KBKu7Bfss8MGa65R6dQPnA7sBZwWMI4pBjrpj0DqM08Mg8PnAMUSRYHW3YDcydoItnWkV8Hbg+4HjmJZdxJXAYuBgbNukvYGl2BLeC7BuxSKsm9GDtXjd2Ohe8nrvpFLFh2REMRl13Ia1TFsaz20EXscGOl4HXgEeA9aECDZDFAkWohUdAp5tHFM1l7FkS/6TmM34Ecj08PmsxuPEfMauAXZR3nVNLgkUSV8uqCo9LN6s5Iue2A5sTT0exobo0/oadSYGgB2NY6Dx+9uZPLTfjqJIsBivg1WxtXG0yzUZqV8UG/C1a4KJlJmWgxwidYkiwWKIQcQHJZiIR8ETrAuYETgGEV+iSDCRTqUEE/FoJPQXXN1D6WRRXAcT6VTBu4hqwaSTKcFEPAqeYCKdLHiCqQWTThY8wUQ6WfAEUwsmnSx4gol0suAJphZMOlnwBBPpZMETTC2YdLLgCSbSyYInmFow6WRKMBGPgieYSCcLnmBqwaSTBU8wmV66mV53sUexw2VoXdga9Qc0jj2wZa0XYMtVz08dafPI38A9WUN9omSp6fSS0slS0eklrNO/34ftANmH7SC5pXG8QXtsYjEDeDdwFXActlz4fzcePxwwrjoEXzo7RBexB9s76p3Yxm0Hkp8osdsKrANeBZ4HnsG+vD9k/JrxocwAvsDk/diOA+7GdhTdVndQNQq+tv4S7H/uiccnPNX3Jmznjaw6O+lYj7UaoV1AcZzHhwvNib0p/nyLp1N/GGA/rBvY6XbHdvIM7aMlr/9eLVGEE3yQo+4u4krg+prrDOWOwPUnXfAifwJcXUMsoQTvIu5OvV3ExPlYsu3Mqb8dj/8DvgdcBxzr7q9qSk4ENlA99r9hbK+0dlLWReyejoMcYCfYd2P/qAcC+2LJviTjmNf4nUVYvHNSz6U32Ksq2YAu2XAOxkYXR4D+xnODjA0A9DO2s2MymrgZeA3b1fF1skct6zYTuALrnk4cdS1yFXAacAnwpPuwggnegu1BmBZM3FoC/AGWHK20wjuAz2D/2bWDshYs9CkYe6IEa1cHAFdi3dIduO3ubgI+hfUaYlaUYCMB49pFCdZeZgDnAY9Sz3llP9aiLa/jw01BUYLFcB2SpSjB2sUpwGPUk1gTj0Hgb7GuaEyKEiyGc2KWoQSL3Uzgk9gJe4jkSh8bgIv9ftymFCXYQMHv1UYJFrce7BwrdGJNPG4ljultRQm2CcKPcuh2lXjNAm4HTg8dSIaLgG9hrWushiF8gkm8vgC8K3QQBc4m7p5OFAmmFixO7wA+EDqICv4c+JXQQeSIIsEkPj3AF0MHUdEc4JrQQeSIIsHUgsXnj4EVoYNownuJ84J0FAkm8bncQ5mj+LvwOhc4x1PZrYgiwdSCxeVtwGEOyxvFpjwtwyb/ngE867D8xHkeymxV8Im+YHcY6zpYPP4Ot9ervpJRxxJsaQOX9fQT5naXoutgq0EtmIx3gsOyBoFrM57fgF3HGnVYVy9uY3chii6ixGM2cLTD8h7BFuTJ8j/A/Q7rAru0EJMoEkwtWDwOxoboXflFyevfdlgXwKmOy2uVEkzGcT3U3Vvy+krH9R0L7Oa4zFZEkWASjwWOyzuJ4rmCz+L2psRu3HZxWxVFgqkFi0dZi9OsfSi+PrUNW6PSdZ2xiCLBJB47PJR5NcXfMdcDHS7PIVulBJNxNnoo82Rsxag812FLfrvQDzzkqCwXhqH5Jcekc/WVv2VK/hpbK//RjNdexs6b3gW8FdgfW6clOXebS/7AxUas1X0JW8rgdmxtyFhEMZNjfzSTIxbL8XcH8mvAEfV9lNoUzeR4ANRFlDGvYJtG+LAn8APcznOMQdEg3RAowWQ8n6vqLsX2A/tNj3XERIMcFS0AFmccMSy64toTnsvfA1tE5/c91xODEZjegxwzsI3gjsbODw7B/pdN1qRf2ERZyY6VyW6VyQn4ALaG/PbG65uw+XnrsRP8F4C1NLoTEbiP4lE/F3YD/hU4CvgYfi4PxCCKf9MQgxyzsX/Yn+fUXfcxiE2MvQZrGUOaiZ2L1fXZHwMOreWT+bEP+Z/tmwHj2iVEgn02p84YjtWEv1j6D9T7mQewBXbacVZPUYJ9A6bnOdiJoQMocAi2nVJIN1DvuupzgS8DDxLvClFTMW0HOb4bOoACdwCrAsfwHHBzgHpPwUYxr6UzBpCm7YXmucA/YoMPIbuDQ9hk1+8Bf0X5dqt1Wk7Yv5+ngd/w/ilbty/5n+EWmJ6jiFuxXRivxEYPD8f+opZjydfL2C6WPdhtEBNtZvwo0VDjuQFsVCw9iril8XMfNl/uNWwUcR2RbHGT4RXsvOhrgeo/DPgRcBO2uGh/8dujNG1bMKnuS4Rt5UexZH+P7w86RfuRH/dNMD3PwaS6D2MtSUh7AXdimz3EuhFflmk7yCHVDQJn0pi4Gti7seXezg8dSErRpQUlmFSyFTgX+H7oQLDZNd/CNgSM4brZaMFrSjCpbCvWkn2G4i9VHWZgQ/m3EH6QTrPpxZkhbDrXe7ER09Auxi63xNCSZRkBJZg0705skvTDoQMBLgE+HjqIHOoiypStBn4LeD/wRthQ+BS23EAI6iKKN6PYbSdvBu4KGEcXtslEbPs1q4soTrwC/Da2cE2oRWeOAC4MUK9aMKnNvVhr9k+B6v9YoHrzqAUT5/qAy7AWzdcycHkOxzYQjIVaMPHmLuB44PGa67205vqKqAUTr57DVva9o8Y6z6be77TOwSSoQeB92NSmOiwlnvvqdB1MajGK3VD6kZrqO62mesoowaRWnwOur6GeY2uoI6HZ9NKUF6l+I2QftqH5Buwu7ceB27C1NfL8BXC3n9B3OcZz+VXpjmaZ5EVavwN5GDi9oI79sdn5vu6AHsbWvqzDioI4LgO1YOJeF8XD5WuBv/dc/14ey09TF1GCOKjk9a/gdn/miZZ5LLsqJZh4s6jk9Rfxu9ZHDOsqKsHEmyp3Gn/HY/113YSpC80SRNZakhP9xGP9MezYoqlSMomr86J5Fd7jcy+ydR7LrkpdRJlkwFE5VRJsM7DNUX1po9SXYBpFlKa85qic2VQbKt/gqL60NdiGh6HpHEwmWe2wrEMqvKfKuVqzfO4z3QwlmEzyY4dlHV3y+hxsq17XfA6eTKRRRGnKA7hbWPQdJa+/GT/D6T6H/5uhBJNJ1uGui3UaxZs1nOmonrS1wE89lDsVSjDJdJujcrqxlYCzLAI+6KietFs8lFmktIsYmmbTx6cX2/DOxcz2EeCiCeXPwVYHdj2Lfgjbr6tOhxbEcwyEXzxf4rMJW/P9KgdlzQBuxZYNWIlNwj0bPxu93wb8wkO5U6UWTHItw5bE9nXPlutjO3CAj7+IEocVxHQ46BxMsq3DTQtWl+uxGfox2QlKMMl3C/Dd0EFU8L/AdYHq1nUwaclF2PqGsdoE/C5xzJ6fSAkmpdZjgxLrQweSYQe2b/PPQgeSQ5N9pZLVwDn4mZg7VduA84AHQwdSQOdgUtl/YmvNPx06EOBV4AzgvtCBoHMwcegF4CTsInEo9wFHAo8EjKEqJZg0bRNwAXAqfu9Inug5rEt4Ju7uWfNNCSZT9hC2RPXvAPfj5wbHnViLdS52QfffPdTRKs1FlFrMwxLhZuwi9VRnZKzCFiU9C5hf6yeYml8j/7PUtbJVISVY55mNzZTfTLWkGgZuBA4OEWyL8hIsitYLlGCd7ARsf7Ci5NqBn/vC6pKXYIPJG3QOJr78BPhqyXu+TDx3IE9FXjdwVwumBBOffljy+rfrCMIjJZgE9WLJ62vqCMKjvPxRgkktniV/CL8f+HmNsfigBJOgNmP7M0+0E7iaSHaBbMHMnOd3JZiWDBDfPo1NbToFeBN2W/89wDMhg3KktAVTgkkd/qNxdJq8BNtZ9gYRKZfXRdx1A6gSTGTq8vJHF5pFHFCCiXikBBPxSAkm4pESTMQjJZiIR0owEY/yroMpwUQcUAsm4pESTMSjvPzZXvYGESmnczARj+bkPK8EE3Fgds7zSjARB9SCiXikBBPxSF1EEY9KW7BZ2AIk82oJZ7LunOcvBt5WZyDS0a4FVnooN68F23UdbBa2PvxRHipvxUGNQ8SFj3oqNy/BBpIfurAtY0Q6ma8FTvO6iH3JD0ow6XTrsAVQfVCCybT3gsey87qIm5IfZlGcYH3ABpcRiXiwENg95zWfCZbVgg2SWhcRbKvOEbI3Evu0x+BEXLmU/E3+fG7m+LWM+l5Jv6EL2AK87DEIEd+Kvr8+W7DejOf60w+SC81PewxCxLeiBFvrsd7KCfakxyBEfCtKMJ9jCAsznluXflCWYHlbZIrEZAP5G/315TzvQlYL9lr6QVmCLXIajogfkwYXUupOsMwW7BmyL8a9xXVEIp7kdRNHPdZZuYs4BPwo483HAcscByXiQ16C5V0fa9VcsjewzEwwgAcy3jwLuMRdTCLevJTzvK8Ey2t4Jl0HS2QlGMBHCHc7i0hVa3Ke38NTffvkPP98+kE6wX5G9vWwpWTvFC8Skxdznj/cU337ZTy3hYIWDODWnMI+DJzsICgRX57Pef5YT/UdlvHcc5QMquwLDJM9p2sVdmInEqNZwDYmf2+f8lTfvRl1faPKL34z4xeT4w60jofE6zEmf2eHsNMcl2ZjU6Im1vXxKr98FPmz60eBzzsOVsSVfyb7O/tHjus5N6eet1ct4J6cApLjKrfxijhxBdnf1x84rGMO8HhGHduBnqqFrMAW7shLsBHgDx0GLeLCEWR/X4ew73SruoCv5tTx42YLuyqnICWZxKoL+CXZ39d/abHsbuDOnLJHgQ81W+BM4KGCApMku6LFwEVcuoH8VixraL2KQ4FHc8odBbYCi6dS8BJseF5JJu3iDPK/qyvJX6gmy0Js0dKtBWWOAje2EvAhwKslFQyjJJPw9ga+TvF39etkL1YzH3grcCHwZ8Dt2K0uRWWNYpOMc2/rqnpD5QrgfuDggveMAB8Abq5YpkiZbsZG5hY1jsWpYxE26fYgbIDjVyuW+wTwOazhOAZr9U4mf53DPJuBs4GH897QzB3LS4G7KZ4yNQL8G9akil9zgd1CB5HSQ/ZeAzPJvjERYAFjt3ykP8+UzmdqtgZ4H/BfLgudBfwltu5bWdOpQ0cnHuuBT+J52uAxwIMRfFgdOuo6ngQup4mLydD6ojanAlcC7yR/KyKRdrUKG3u4i4LzrCKuVo3qAU7E5jEmWw+tAA4grvMEkcQAthrVG40/12HnVS9gt76sxgZBWlLHsmyLsesJWcd8xo8U9WInxekT44knzwvJntE/h/w7r9Mn0yHkxVyHLcDOGurZhF2uKZIMeyd2kNpLq2EzdlE4MUxqM4WGrUxepm3jhNf6sc+9CVsvflvj5wEsqfKWeXPq/wGIK6YmfygQ+QAAAABJRU5ErkJggg==",
                              }),
                            }),
                            Object(u.jsx)(Wt, { children: "Projects" }),
                          ],
                        }),
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                      "admin" === i
                        ? Object(u.jsx)(Ve.b, {
                            to: "/AdminUsersPage",
                            style: { textDecoration: "none" },
                            children: Object(u.jsxs)(qt, {
                              children: [
                                Object(u.jsx)(Kt, {
                                  children: Object(u.jsx)(Vt, { src: He }),
                                }),
                                Object(u.jsx)(Wt, { children: "Users" }),
                              ],
                            }),
                          })
                        : Object(u.jsx)(u.Fragment, {}),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                      Object(u.jsx)(Ve.b, {
                        to: E,
                        style: { textDecoration: "none" },
                        children: Object(u.jsxs)(qt, {
                          children: [
                            Object(u.jsx)(Kt, {
                              children: Object(u.jsx)(Vt, {
                                src: "data:image/png;base64,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",
                              }),
                            }),
                            Object(u.jsx)(Wt, { children: "Training" }),
                          ],
                        }),
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                      "admin" === i
                        ? Object(u.jsx)("div", {
                            style: {
                              width: "100%",
                              backgroundColor: "black",
                              height: ".05vh",
                            },
                          })
                        : Object(u.jsx)(u.Fragment, {}),
                      Object(u.jsx)(Ve.b, {
                        to: P,
                        style: { textDecoration: "none" },
                        children: Object(u.jsxs)(qt, {
                          children: [
                            Object(u.jsx)(Kt, {
                              children: Object(u.jsx)(Vt, { src: We }),
                            }),
                            Object(u.jsx)(Wt, { children: "Payments" }),
                          ],
                        }),
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                      Object(u.jsx)(Ve.b, {
                        to: _,
                        style: { textDecoration: "none" },
                        children: Object(u.jsxs)(qt, {
                          children: [
                            Object(u.jsx)(Kt, {
                              children: Object(u.jsx)(Vt, { src: Qe }),
                            }),
                            Object(u.jsx)(Wt, { children: "Account" }),
                          ],
                        }),
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                      Object(u.jsxs)(qt, {
                        onClick: K,
                        children: [
                          Object(u.jsx)(Kt, {
                            children: Object(u.jsx)(Vt, {
                              onClick: K,
                              src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAACxklEQVRoge2ZPWhTYRSGn/PdpuKggxVEqaWkSVuwQ1FB0RqrJqUV6dal0l1wcHNwEXXzZ3UVhC52UFCoNmmNaWsV/EMI/Zeqk6BSRFCS3nscav0JN21tvOYK99lycu775eEk+b6bQEBAwHKIW3HHjq7K3Kb5Cwg9wFYP17eBcRU5M/Ng4HYpQcatmK+aP49wGm8lACygSVRvNrQmdpcSVOFWVOgBMErL5HBytJQFlqWry4q+m78CnFLVbuDJWqNcJwJsA/BUAqCvzxZkDMDRxTXXSjGR/45AxG8EIn4jEPEbgYjfcD2ilJtILH5WIFppFk5k0+nPq7mm7BNxcLSwJtAJcjxnh/ob9nduWE1O2UUUM4YyIkrfUk0culR5jdCi1pe7kT0dG1fKcb0ficYSCjCdSbo+/y8It8RrLCP3gbAIT0M505Ydu/exWH/ZJ1KMVyOpN7ajh1CZVWVXLmQnG48cqSrW71sRWJRxhEPADMhOO29SxWR8LQIwmxl4mzf5A8A40GznTaq+tXVzYZ/nX7/1scSowr6SQpzfHjWrE7oD7P216PlEVAtehkd4PpHp4eSBUjPqYm3bDToERIAXYvLHCnt8/xkJt8RrjHKfRYnnVsiJT6XT7wv7fHlEWeLnXqJh0GdWSNsmBgc/uPX6diKNre21lpE03zfEyryVKCYBPphI5PDhOlmwbgl6aSqTug4QjiWitmMPAdUCD52vFR3Zx/2flssp/0QWzC6gyYGjSyULbgDVKCNir2+fWUECfDARgxGl8ACsvYp5uc7KncwOJ1d1jC+7iBvTmdTlP72m/G+tv0Qg4jcCEb8RiPiNQMRvFNvZ54DaaCzeLQ6PvFrcrrCMOtoJYJC5UrLcRVSuInoRpFc9nJlxftwFfxHbulZKVrEf4CRyMH5C1PSAbillgRVwEJ0wIucm08k1/zUdEBCwMt8AqJ/bdz6mnCwAAAAASUVORK5CYII=",
                            }),
                          }),
                          Object(u.jsx)(Wt, {
                            onClick: K,
                            children: "Log Out",
                          }),
                        ],
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                      Object(u.jsxs)(qt, {
                        href: Xt,
                        target: "_blank",
                        children: [
                          Object(u.jsx)(Kt, {
                            children: Object(u.jsx)(Vt, {
                              href: Xt,
                              target: "_blank",
                              src: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAABmJLR0QA/wD/AP+gvaeTAAACSklEQVRoge3XT0sUYRzA8e8zjuKfKGONMCRN3KXaU3hxox2tdfNQliR7jU5BvYFuUad6AR06d/ASBRlSpiPruiARXjs4rbphQoSxRRnp9jwdpDDRdZ8FZ4Sez2lh5/B9mJnn9wwYhmEYhmEYxv9ClHvh8UQiJNesYQVFLzPWvZtRlbDKuaitp6dRFq1RBaeB2l1uqsiOCznS2V9fLe1hpegEPFtZAz50aasq9WdLLFbXUCtGQHQD74v2r3Pe5PiiT21atl1INJqqsfbJJyDOAx+EVD25SXfBxzYtWy8klao6KAtDwADwSSmZ8LLurK9lmrZ4R+5Y4Y9fHilIAQWF6ns35b71vUzT5jsiwo79ELgGfBVCJr2MOxNAl7aNd0REnN4HIK4DKyD6ZyfdN0GF6bL//Ig4yXsKbgKr0pKDubSbCbBLmwCIxJN3leB20DEVUWS9qbF4WZN9TxNKwYazVsRJ3ldwi/VH63Iu7b4MLK4Cf3et5fyc29TafghEl1DiSqi1I/s5n8sHGafjn+13OT/3ItTa3gyiCxhsajvmLufnlwJq07L5HVFe5swNEEPAfqWsVx1O76kgwnRtNdmld/jAVQGPgUaBGO2IJ076XqZp2w+raDRVsxoqPAUusH5odGaz43P+pekp+YXYEovV1Vc3jCjEWdaP8c78xMSe3ABKzpHF6ekf377XXQQ1BRy1i1VjJ+J9zT61adlxIC7NPF9Zs4qXhGAGCBeFfOZDl7ayJvtCOl2wbNkHvEbxc5ebDMMwDMMwDMMo6TddVq+iyKCPFgAAAABJRU5ErkJggg==",
                            }),
                          }),
                          Object(u.jsx)(Wt, {
                            href: Xt,
                            target: "_blank",
                            children: "Kaart.com",
                          }),
                        ],
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          width: "100%",
                          backgroundColor: "black",
                          height: ".05vh",
                        },
                      }),
                    ],
                  })
                : Object(u.jsxs)(Nt, {
                    onClick: e.toggleSidebar,
                    children: [
                      Object(u.jsxs)("div", {
                        style: {
                          width: "20vw",
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                        },
                        children: [
                          Object(u.jsx)("img", {
                            style: {
                              height: "5vh",
                              marginLeft: "3vh",
                              marginTop: "3vh",
                            },
                            src: Ge,
                            alt: "Kaart Logo",
                          }),
                          Object(u.jsx)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                            },
                            children: Object(u.jsx)(kt, {
                              title_text: "Welcome to Mikro",
                            }),
                          }),
                        ],
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          position: "absolute",
                          left: "10vh",
                          top: "4.5vh",
                        },
                        children: Object(u.jsx)(At, {
                          subtitle_text: "Click to open Menu",
                        }),
                      }),
                    ],
                  }),
            });
          }),
        $t =
          (n(178),
          function () {
            var e = Object(a.useContext)(ye),
              t = e.sidebarOpen,
              n = e.handleSetSidebarState,
              i = e.orgProjects,
              c = e.fetchOrgProjects,
              s = e.goToSource,
              r = e.fetchAdminDashStats,
              l = e.activeProjects,
              d = e.completedProjects,
              b = e.tasksMapped,
              x = e.tasksValidated,
              h = e.tasksInvalidated,
              g = e.payableTotal,
              O = e.requestsTotal,
              p = e.paidTotal,
              f = e.activeProjectsCount,
              v = e.inactiveProjectsCount,
              y = e.admin_update_all_user_tasks,
              w = Object(a.useContext)(m),
              S = w.refresh,
              _ = w.user,
              k = Object(a.useState)(!1),
              A = Object(o.a)(k, 2),
              C = A[0],
              P = A[1],
              D = Object(a.useState)(0),
              R = Object(o.a)(D, 2),
              T = R[0],
              E = R[1],
              I = Object(a.useState)(10),
              L = Object(o.a)(I, 2),
              B = L[0],
              U = L[1],
              M = Object(a.useState)(null),
              F = Object(o.a)(M, 2),
              Y = F[0],
              N = F[1];
            Object(a.useEffect)(function () {
              _ && S(),
                null === _ && P(!0),
                null !== _ && "admin" !== _.role && P(!0),
                c(),
                r(),
                y();
            }, []);
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsxs)("div", {
                  style: { width: "100%", float: "left" },
                  children: [
                    Object(u.jsx)(Zt, {
                      isOpen: t,
                      toggleSidebar: function () {
                        n();
                      },
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        position: "relative",
                        left: "15vw",
                        flexDirection: "column",
                        height: "100vh",
                      },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            marginLeft: "6vh",
                            flexDirection: "row",
                          },
                          children: [
                            Object(u.jsx)("h1", {
                              style: { marginTop: "1vw", paddingBottom: "2vh" },
                              children: "Dashboard:",
                            }),
                            Object(u.jsx)("div", {
                              style: {
                                marginTop: "1vw",
                                position: "relative",
                                left: "37.5vw",
                              },
                            }),
                          ],
                        }),
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            height: "44vh",
                          },
                          children: [
                            Object(u.jsx)(yt, {
                              title: "Projects Overview",
                              subtitle_text_1: "Active:",
                              subtitle_text_2: "Inactive:",
                              subtitle_text_3: "Completed:",
                              value_1: f,
                              value_2: v,
                              value_3: d,
                            }),
                            Object(u.jsx)(yt, {
                              title: "Tasks Overview",
                              subtitle_text_1: "Awaiting Approval:",
                              subtitle_text_2: "Approved:",
                              subtitle_text_3: "Invalidated:",
                              value_1: b,
                              value_2: x,
                              value_3: h,
                            }),
                            Object(u.jsx)(yt, {
                              title: "Payment Overview",
                              subtitle_text_1: "Payable Total:",
                              subtitle_text_2: "Payout Requests:",
                              subtitle_text_3: "Payouts to Date:",
                              value_1: "$".concat(g),
                              value_2: "$".concat(O),
                              value_3: "$".concat(p),
                            }),
                          ],
                        }),
                        Object(u.jsx)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            marginLeft: "3.5vw",
                            height: "42vh",
                            width: "77.5vw",
                          },
                          children: Object(u.jsxs)(xt, {
                            style: { boxShadow: "1px 1px 6px 2px gray" },
                            children: [
                              Object(u.jsx)(bt, {}),
                              Object(u.jsxs)(jt.a, {
                                children: [
                                  Object(u.jsx)(Rt, { headLabel: pt }),
                                  Object(u.jsx)(dt.a, {
                                    children:
                                      l &&
                                      l
                                        .slice(T * B, T * B + B)
                                        .map(function (e) {
                                          var t = e.id,
                                            n = e.name,
                                            i = e.difficulty,
                                            a = e.rate_per_task,
                                            c = e.total_tasks,
                                            r = e.tasks_mapped,
                                            o = e.tasks_validated,
                                            l = e.tasks_invalidated,
                                            j = e.url,
                                            d = (e.source, e.max_payment),
                                            b = e.payment_due;
                                          return Object(u.jsxs)(
                                            Ot,
                                            {
                                              sx: {
                                                "&:hover": {
                                                  backgroundColor:
                                                    "rgba(145, 165, 172, 0.5)",
                                                  cursor: "pointer",
                                                },
                                              },
                                              align: "center",
                                              tabIndex: -1,
                                              onClick: function () {
                                                N(t);
                                              },
                                              selected: Y === t,
                                              onDoubleClick: function () {
                                                return s(j);
                                              },
                                              children: [
                                                Object(u.jsx)(wt, { entry: n }),
                                                Object(u.jsx)(wt, {
                                                  entry: "$".concat(a),
                                                }),
                                                Object(u.jsx)(wt, { entry: c }),
                                                Object(u.jsx)(wt, { entry: i }),
                                                Object(u.jsx)(wt, {
                                                  entry: "$".concat(d),
                                                }),
                                                Object(u.jsx)(wt, {
                                                  entry: "$".concat(b),
                                                }),
                                                Object(u.jsx)(wt, {
                                                  entry: ""
                                                    .concat(o, "/")
                                                    .concat(r),
                                                }),
                                                Object(u.jsx)(wt, { entry: l }),
                                              ],
                                            },
                                            t
                                          );
                                        }),
                                  }),
                                ],
                              }),
                              Object(u.jsx)(ut.a, {
                                style: { width: "100%" },
                                rowsPerPageOptions: [5, 10, 15],
                                component: "div",
                                count: i ? i.length : 5,
                                rowsPerPage: B,
                                page: T,
                                onPageChange: function (e, t) {
                                  return E(t);
                                },
                                onRowsPerPageChange: function (e) {
                                  return (function (e) {
                                    U(e.target.value);
                                  })(e);
                                },
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                C
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        en =
          (Pe.b.div(
            be ||
              (be = Object(Ce.a)([
                "\n  font-weight: bold;\n  font-size: 14px;\n  line-height: 1.4285em;\n  color: rgba(0, 0, 0, 0.87);\n  box-sizing: inherit;\n  display: flex;\n  flex-direction: column;\n",
              ]))
          ),
          Pe.b.div(
            xe ||
              (xe = Object(Ce.a)([
                '\n  margin: 1em;\n  background-color: white;\n  border: 0.75px solid black;\n  border-radius: 1.5em;\n  font-family: Lato, "Helvetica Neue", Arial, Helvetica, sans-serif;\n  font-size: 14px;\n  line-height: 1.4285em;\n  color: rgba(0, 0, 0, 0.87);\n  box-sizing: inherit;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n',
              ]))
          ),
          Pe.b.button(
            he ||
              (he = Object(Ce.a)([
                "\n  font-family: sans-serif;\n  font-size: 100%;\n  align-self: center;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  line-height: 1.15;\n  overflow: visible;\n  text-transform: none;\n  border-radius: 6px;\n  margin-top: 1em;\n  margin-bottom: 1em;\n  background-color: #f4753c;\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  cursor: ",
                ";\n  &:hover {\n    background-color: ",
                ";\n  }\n",
              ])),
            function (e) {
              return e.disabled ? "not-allowed" : "pointer";
            },
            function (e) {
              return e.disabled ? "gray" : "#c85823";
            }
          )),
        tn =
          (Pe.b.input(
            ge ||
              (ge = Object(Ce.a)([
                "\n  box-sizing: inherit;\n  font-family: sans-serif;\n  font-size: 100%;\n  line-height: 1.15;\n  overflow: visible;\n  width: 90%;\n  display: flex;\n  align-self: center;\n  padding: 12px 20px;\n  margin: 8px 0;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n",
              ]))
          ),
          Pe.b.textarea(
            Oe ||
              (Oe = Object(Ce.a)([
                "\n  font-family: sans-serif;\n  font-size: 100%;\n  line-height: 1.15;\n  overflow: visible;\n  width: 90%;\n  display: flex;\n  align-self: center;\n  padding: 12px 20px;\n  height: 75%;\n  resize: none;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  box-sizing: border-box;\n",
              ]))
          ),
          Pe.b.p(
            pe ||
              (pe = Object(Ce.a)([
                "\n  display: flex;\n  align-self: center;\n  justify-content: center;\n  align-items: center;\n  font-weight: 400;\n  width: 75%;\n",
              ]))
          ),
          Pe.b.h3(
            fe ||
              (fe = Object(Ce.a)([
                "\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  padding: 0.5em;\n",
              ]))
          ),
          Pe.b.h4(
            me ||
              (me = Object(Ce.a)([
                "\n  display: flex;\n  justify-content: center;\n  align-items: center;\n",
              ]))
          ),
          Pe.b.div(
            ve ||
              (ve = Object(Ce.a)([
                "\n  margin-left: 2em;\n  margin-right: 2em;\n",
              ]))
          ),
          function () {
            var e = Object(a.useContext)(ye).history,
              t = (Object(j.h)().state || { from: { pathname: "/" } }).from;
            return Object(u.jsx)("div", {
              style: {
                padding: "10px",
                height: window.innerHeight - 100,
                width: "100%",
                backgroundColor: "white",
              },
              children: Object(u.jsxs)("p", {
                style: { textAlign: "center", marginTop: "20%" },
                children: [
                  "Page Not Found",
                  Object(u.jsx)("br", {}),
                  Object(u.jsx)("br", {}),
                  Object(u.jsx)(en, {
                    onClick: function () {
                      return e.push(t);
                    },
                    children: "Go Back",
                  }),
                ],
              }),
            });
          });
      function nn(e) {
        var t = e.leaders.map(function (e) {
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsx)("h5", {
                  style: {
                    padding: "5px",
                    border: "1px solid grey",
                    backgroundColor: "white",
                    fontWeight: "bolder",
                    display: "inline",
                    marginRight: "0.25em",
                    marginLeft: "0.25em",
                  },
                  children: /^U\+[a-z0-9]+$/.test(e)
                    ? String.fromCharCode("0x" + e.substring(2, e.length))
                    : e,
                }),
                "+",
              ],
            });
          }),
          n = e.keys.map(function (t, n) {
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsx)("h5", {
                  style: {
                    padding: "5px",
                    border: "1px solid grey",
                    backgroundColor: "white",
                    fontWeight: "bolder",
                    display: "inline",
                    marginRight: "0.25em",
                    marginLeft: "0.25em",
                  },
                  children: /^U\+[a-z0-9]+$/.test(t)
                    ? String.fromCharCode("0x" + t.substring(2, t.length))
                    : t,
                }),
                n === e.keys.length - 1 ? "" : "/",
              ],
            });
          });
        return Object(u.jsxs)(u.Fragment, { children: [t, " ", n] });
      }
      var an,
        cn,
        sn,
        rn,
        on,
        ln,
        jn,
        dn,
        un,
        bn,
        xn,
        hn,
        gn,
        On,
        pn,
        fn,
        mn,
        vn,
        yn,
        wn,
        Sn,
        _n,
        kn,
        An,
        Cn,
        Pn,
        Dn,
        Rn,
        Tn,
        En,
        In,
        Ln,
        Bn,
        Un,
        Mn,
        Fn,
        Yn,
        Nn,
        qn,
        zn,
        Kn,
        Vn,
        Hn,
        Wn,
        Qn,
        Gn,
        Jn,
        Xn,
        Zn,
        $n,
        ei,
        ti,
        ni,
        ii = function () {
          var e = [
            { icon: nn({ leaders: [], keys: ["q"] }), desc: "Action 1" },
            { icon: nn({ leaders: [], keys: ["e"] }), desc: "Action 2" },
            { icon: nn({ leaders: [], keys: ["SPACE"] }), desc: "Action 3" },
            {
              icon: nn({ leaders: [], keys: ["a", "U+2190"] }),
              desc: "Action 4",
            },
            {
              icon: nn({ leaders: [], keys: ["d", "U+2192"] }),
              desc: "Action 5",
            },
            {
              icon: nn({ leaders: ["SHIFT"], keys: ["a", "U+2190"] }),
              desc: "Action 6",
            },
            {
              icon: nn({ leaders: ["SHIFT"], keys: ["d", "U+2192"] }),
              desc: "Action 7",
            },
            {
              icon: nn({
                leaders: ["U+02303", "SHIFT"],
                keys: ["a", "U+2190"],
              }),
              desc: "Action 8",
            },
            {
              icon: nn({
                leaders: ["U+02303", "SHIFT"],
                keys: ["d", "U+2192"],
              }),
              desc: "Action 9",
            },
          ];
          return Object(u.jsxs)("div", {
            style: {
              textAlign: "center",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              position: "absolute",
            },
            children: [
              Object(u.jsx)("h1", { children: "Hotkeys" }),
              Object(u.jsx)("table", {
                style: { border: "2px solid grey" },
                children: e.map(function (e) {
                  return Object(u.jsxs)("tr", {
                    style: { borderBottom: "2px dotted grey" },
                    children: [
                      Object(u.jsx)("td", {
                        style: {
                          padding: "15px 15px",
                          display: "inline-block",
                          width: "100%",
                        },
                        children: e.icon,
                      }),
                      Object(u.jsx)("td", {
                        style: {
                          padding: "15px 15px",
                          borderLeft: "2px dotted grey",
                        },
                        children: e.desc,
                      }),
                    ],
                  });
                }),
              }),
            ],
          });
        },
        ai = n.p + "static/media/laptop.12a3457e.png",
        ci = (n(179), n(264)),
        si =
          (Pe.b.div(
            an ||
              (an = Object(Ce.a)([
                "\n  border-width: 0px;\n  z-index: 9999;\n  position: absolute;\n  box-shadow: 3px 0px 5px #253e45;\n  left: 0;\n  height: 100%;\n  width: 220px;\n  transition: left 0.3s ease-in-out;\n  background-color: white;\n",
              ]))
          ),
          Pe.b.div(
            cn ||
              (cn = Object(Ce.a)([
                "\n  border-width: 0px;\n  z-index: 9999;\n  position: absolute;\n  left: 0;\n  height: 100%;\n  width: 15vw;\n  transition: left 0.3s ease-in-out;\n  background-color: transparent;\n",
              ]))
          ),
          Pe.b.a(
            sn ||
              (sn = Object(Ce.a)([
                "\n  position: relative;\n  color: #253e45 !important;\n  padding-left: 4rem;\n  padding: 1rem;\n  display: block;\n  text-decoration: none;\n  box-sizing: border-box;\n  &:hover {\n    cursor: pointer;\n    background: rgba(145, 165, 172, 0.1);\n  }\n",
              ]))
          ),
          Pe.b.div(
            rn ||
              (rn = Object(Ce.a)([
                "\n  display: flex;\n  align-items: center;\n  &:hover {\n    cursor: pointer;\n  }\n",
              ]))
          ),
          Pe.b.div(
            on ||
              (on = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  background-repeat: no-repeat;\n  background-position: 50%;\n  max-width: 100%;\n  width: 100px;\n  height: 80px;\n  /* position: relative; */\n  &:hover {\n    cursor: pointer;\n  }\n",
              ])),
            Mt
          ),
          Pe.b.div(
            ln ||
              (ln = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  background-repeat: no-repeat;\n  background-position: 50%;\n  max-width: 100%;\n  width: 100px;\n  height: 80px;\n  position: relative;\n  &:hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n",
              ])),
            Bt
          ),
          Pe.b.span(
            jn ||
              (jn = Object(Ce.a)([
                "\n  border-radius: 50%;\n  height: 16px;\n  width: 16px;\n  text-align: center;\n  box-sizing: border-box;\n  font-size: var(--h3);\n",
              ]))
          ),
          Pe.b.img(
            dn || (dn = Object(Ce.a)(["\n  width: 74%;\n  height: 70%;\n"]))
          )),
        ri =
          (Pe.b.div(
            un ||
              (un = Object(Ce.a)([
                "\n  top: 1.5%;\n  right: 20px;\n  position: absolute;\n  height: 66px;\n  width: 32px;\n  pointer-events: none;\n  z-index: 999;\n",
              ]))
          ),
          Pe.b.div(
            bn ||
              (bn = Object(Ce.a)([
                "\n  border-radius: 25px;\n  width: 75%;\n  height: 25px;\n  pointer-events: auto;\n  background: rgba(145, 165, 172, 0.3);\n  cursor: pointer;\n",
              ]))
          ),
          Pe.b.div(
            xn ||
              (xn = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  position: relative;\n  top: 0;\n  left: 0;\n  background-size: contain;\n  background-repeat: no-repeat;\n  opacity: 1;\n  width: 24px;\n  height: 24px;\n  &:hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n",
              ])),
            Ft
          ),
          Pe.b.div(
            hn ||
              (hn = Object(Ce.a)([
                "\n  background-image: url(",
                ");\n  background-repeat: no-repeat;\n  background-size: 20px 20px;\n  position: absolute;\n  left: 14rem;\n  width: 13%;\n  height: 3rem;\n  top: 15px;\n  &:hover {\n    cursor: pointer;\n    opacity: 0.7;\n  }\n",
              ])),
            Ut
          ),
          Pe.b.a(
            gn ||
              (gn = Object(Ce.a)([
                "\n  text-align: left;\n  margin-left: 1.2vw;\n  color: #253e45 !important;\n  text-decoration: none;\n  font-size: 15px;\n  font-weight: 500;\n  background-color: transparent !important;\n  border-right: none !important;\n",
              ]))
          ),
          Pe.b.div(
            On ||
              (On = Object(Ce.a)([
                "\n  /* padding-top: 0.5vw; */\n  text-align: center;\n  margin: auto;\n  margin-top: 1rem;\n  margin-bottom: 1rem;\n  height: 4rem;\n  width: 16rem;\n  background: rgba(145, 165, 172, 0.2);\n  border-radius: 6px;\n",
              ]))
          ),
          Pe.b.h6(
            pn ||
              (pn = Object(Ce.a)([
                "\n  /* text-align: center; */\n  /* font-size: 1.1rem; */\n  padding-top: 5px;\n  color: #253e45;\n  font-weight: 700;\n",
              ]))
          ),
          Pe.b.h6(
            fn ||
              (fn = Object(Ce.a)([
                "\n  /* text-align: center; */\n  color: #253e45;\n  opacity: 0.7;\n",
              ]))
          ),
          function (e) {
            var t = C(!1),
              n = Object(o.a)(t, 2),
              i = n[0],
              a = n[1];
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsxs)("div", {
                  style: {
                    backgroundColor: "black",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                  },
                  children: [
                    Object(u.jsx)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "row",
                        justifyContent: "right",
                        height: "auto",
                      },
                      children: Object(u.jsx)(Ve.b, {
                        to: "/login",
                        style: { textDecoration: "none" },
                        children: Object(u.jsx)(ci.a, {
                          style: {
                            marginRight: "9vw",
                            marginTop: "4vh",
                            backgroundColor: "#f4753c",
                            color: "black",
                          },
                          size: "large",
                          variant: "contained",
                          onClick: function () {
                            a();
                          },
                          children: "Login",
                        }),
                      }),
                    }),
                    Object(u.jsxs)("div", {
                      style: { display: "flex", flexDirection: "row" },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "column",
                            marginLeft: "10vw",
                            marginTop: "13vh",
                          },
                          children: [
                            Object(u.jsxs)(st.a, {
                              variant: "h2",
                              sx: { color: "common.white" },
                              children: [
                                "Make Maps",
                                Object(u.jsx)("br", {}),
                                "Make Money",
                                Object(u.jsx)("br", {}),
                                "Make a Difference",
                                Object(u.jsx)("br", {}),
                                "with",
                                Object(u.jsx)(st.a, {
                                  component: "span",
                                  variant: "h1",
                                  sx: { color: "#f4753c" },
                                  children: "\xa0Mikro",
                                }),
                              ],
                            }),
                            Object(u.jsx)("div", {
                              style: { marginTop: "4vh" },
                              children: Object(u.jsx)(st.a, {
                                variant: "h6",
                                sx: { color: "common.white" },
                                children:
                                  "Micro-payments platform for Open Street Map\xa9",
                              }),
                            }),
                            Object(u.jsx)("div", {
                              children: Object(u.jsx)(Ve.b, {
                                to: "/login",
                                style: { textDecoration: "none" },
                                children: Object(u.jsx)(ci.a, {
                                  size: "large",
                                  variant: "contained",
                                  style: {
                                    marginRight: "1vw",
                                    marginTop: "5vh",
                                    backgroundColor: "#f4753c",
                                    color: "black",
                                  },
                                  children: "Start Mapping Today",
                                }),
                              }),
                            }),
                          ],
                        }),
                        Object(u.jsx)("div", {
                          style: {
                            position: "absolute",
                            top: "47%",
                            left: "33vw",
                            height: "15vh",
                          },
                          children: Object(u.jsx)("img", {
                            style: { height: "9vh" },
                            src: Ge,
                          }),
                        }),
                        Object(u.jsx)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            justifyContent: "center",
                            width: "50%",
                            height: "100%",
                            marginLeft: "18vh",
                            marginTop: "12vh",
                          },
                          children: Object(u.jsx)(si, {
                            style: { marginTop: "5vh" },
                            src: ai,
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                i
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        oi = (n(180), n(17)),
        li = n(265),
        ji = Object(Xe.a)("div")(function (e) {
          e.theme;
          return {
            display: "flex",
            position: "relative",
            backgroundColor: "#f4753c",
            paddingTop: "1vh",
            "&:before": {
              top: 0,
              width: "100%",
              height: "100%",
              position: "absolute",
              WebkitBackdropFilter: "blur(3px)",
              fontWeight: "400",
            },
          };
        }),
        di = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.addOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleAddOpen }),
                  Object(u.jsx)(kt, { title_text: "Add New Project" }),
                  Object(u.jsx)(At, {
                    subtitle_text:
                      "Enter the project URL from the OSM tasking manager, the max number of editors and rate per task or total project budget.",
                  }),
                  Object(u.jsx)(at.a, {}),
                  Object(u.jsxs)("div", {
                    style: { display: "flex", flexDirection: "column" },
                    children: [
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "URL:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.url,
                            onChange: function (t) {
                              return e.handleSetUrl(t);
                            },
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Budget:" }),
                          Object(u.jsx)(kt, { title_text: "$" }),
                          Object(u.jsx)("input", {
                            type: "number",
                            min: "0.01",
                            step: "0.01",
                            value: e.rate,
                            onChange: function (t) {
                              return e.handleSetRate(t);
                            },
                            style: { height: "5vh", marginRight: "1vw" },
                          }),
                          Object(u.jsx)(kt, { title_text: "Type:" }),
                          Object(u.jsx)(At, {
                            subtitle_text: "rate per task:",
                          }),
                          Object(u.jsx)("input", {
                            type: "radio",
                            value: "rate per task",
                            name: "rate per task",
                            onChange: function () {
                              return e.handleToggleRateMethod();
                            },
                            checked: !0 === e.rateMethod,
                          }),
                          Object(u.jsx)("span", { style: { width: "2vw" } }),
                          Object(u.jsx)(At, { subtitle_text: "Total Budget:" }),
                          Object(u.jsx)("input", {
                            type: "radio",
                            value: "Total Budget",
                            name: "Total Budget",
                            onChange: function () {
                              return e.handleToggleRateMethod();
                            },
                            checked: !1 === e.rateMethod,
                            style: { marginRight: "2%" },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                        },
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Project Visibility:",
                          }),
                          Object(u.jsx)("span", { style: { width: "3vw" } }),
                          Object(u.jsx)(At, { subtitle_text: "Public:" }),
                          Object(u.jsx)("input", {
                            type: "radio",
                            value: "public",
                            name: "public",
                            onChange: function () {
                              return e.handleToggleVisibility();
                            },
                            checked: !0 === e.visibility,
                          }),
                          Object(u.jsx)("span", { style: { width: "5vw" } }),
                          Object(u.jsx)(At, { subtitle_text: "Private:" }),
                          Object(u.jsx)("input", {
                            type: "radio",
                            value: "private",
                            name: "private",
                            onChange: function () {
                              return e.handleToggleVisibility();
                            },
                            checked: !1 === e.visibility,
                            style: { marginRight: "6.5vw" },
                          }),
                          Object(u.jsx)(Pt, {
                            button_text: "Create Project",
                            button_action: e.handleCreateProject,
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginBottom: "2vh",
                          marginLeft: "1vw",
                        },
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Budget Calculator:",
                          }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.outputRate,
                            onChange: function (t) {
                              return e.handleOutputRate(t);
                            },
                            style: {
                              height: "5vh",
                              width: "24vw",
                              marginRight: "1.25vw",
                            },
                          }),
                          Object(u.jsx)(Pt, {
                            button_text: "Calculate",
                            button_action: e.handleCalculateRate,
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            },
            "add"
          );
        },
        ui = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.deleteOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleDeleteOpen }),
                  Object(u.jsx)(kt, {
                    title_text:
                      "Are you sure you want to delete the following project?",
                  }),
                  Object(u.jsx)(At, {
                    subtitle_text: "PROJECT # ".concat(e.projectSelected),
                  }),
                  Object(u.jsx)(bi, {
                    handleDeleteOpen: e.handleDeleteOpen,
                    do_delete_project: e.handleDeleteProject,
                  }),
                ],
              }),
            },
            "delete"
          );
        },
        bi = function (e) {
          return Object(u.jsxs)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              textAlign: "center",
              justifyContent: "center",
            },
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.handleDeleteOpen,
                cancel_text: "Cancel",
              }),
              Object(u.jsx)(_t, {
                confirm_action: e.do_delete_project,
                confirm_text: "Delete",
              }),
            ],
          });
        },
        xi = function (e) {
          var t = Object(a.useState)(0),
            n = Object(o.a)(t, 2),
            i = n[0],
            c = (n[1], Object(a.useState)(10)),
            s = Object(o.a)(c, 2),
            r = s[0];
          s[1];
          return (
            Object(a.useEffect)(
              function () {
                null !== e.projectSelected &&
                  e.fetchProjectUsers(e.projectSelected);
              },
              [e.projectSelected]
            ),
            Object(u.jsx)(u.Fragment, {
              children:
                e.projectSelectedDetails && null != e.projectSelectedDetails
                  ? Object(u.jsx)(
                      lt.a,
                      {
                        open: e.modifyOpen,
                        children: Object(u.jsxs)(ht, {
                          children: [
                            Object(u.jsx)(Ct, {
                              close_action: e.handleModifyOpen,
                            }),
                            Object(u.jsx)(kt, {
                              title_text: "Edit Project ".concat(
                                e.projectSelectedDetails.name
                              ),
                            }),
                            Object(u.jsx)(oi.d, {
                              children: Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                },
                                children: [
                                  Object(u.jsxs)(oi.b, {
                                    children: [
                                      Object(u.jsx)(oi.a, {
                                        children: "Budget",
                                      }),
                                      Object(u.jsx)(oi.a, {
                                        children: "Users",
                                      }),
                                      Object(u.jsx)(oi.a, {
                                        children: "Settings",
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)(oi.c, {
                                    children: [
                                      Object(u.jsx)("div", {
                                        style: {
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginLeft: "1vw",
                                          width: "100%",
                                        },
                                      }),
                                      Object(u.jsx)(at.a, {}),
                                      Object(u.jsxs)("div", {
                                        style: {
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginLeft: "1vw",
                                        },
                                        children: [
                                          Object(u.jsx)(kt, {
                                            title_text: "Budget:",
                                          }),
                                          Object(u.jsx)(kt, {
                                            title_text: "$",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "number",
                                            min: "0.01",
                                            step: ".01",
                                            value: e.rate,
                                            onChange: function (t) {
                                              return e.handleSetRate(t);
                                            },
                                            style: {
                                              height: "5vh",
                                              marginRight: "1vw",
                                            },
                                          }),
                                          Object(u.jsx)(kt, {
                                            title_text: "Type:",
                                          }),
                                          Object(u.jsx)(At, {
                                            subtitle_text: "rate per task:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "radio",
                                            value: "rate per task",
                                            name: "rate per task",
                                            onChange: function () {
                                              return e.handleToggleRateMethod();
                                            },
                                            checked: !0 === e.rateMethod,
                                          }),
                                          Object(u.jsx)("span", {
                                            style: { width: "2vw" },
                                          }),
                                          Object(u.jsx)(At, {
                                            subtitle_text: "Total Budget:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "radio",
                                            value: "Total Budget",
                                            name: "Total Budget",
                                            onChange: function () {
                                              return e.handleToggleRateMethod();
                                            },
                                            checked: !1 === e.rateMethod,
                                            style: { marginRight: "2%" },
                                          }),
                                        ],
                                      }),
                                      Object(u.jsx)(at.a, {}),
                                      Object(u.jsxs)("div", {
                                        style: {
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginBottom: "2vh",
                                          marginLeft: "1vw",
                                        },
                                        children: [
                                          Object(u.jsx)(kt, {
                                            title_text: "Budget Calculator:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "text",
                                            defaultValue: "",
                                            value: e.outputRate,
                                            onChange: function (t) {
                                              return e.handleOutputRate(t);
                                            },
                                            style: {
                                              height: "5vh",
                                              width: "24vw",
                                              marginRight: "1.25vw",
                                            },
                                          }),
                                          Object(u.jsx)(Pt, {
                                            button_text: "Calculate",
                                            button_action:
                                              e.handleCalculateRate,
                                          }),
                                        ],
                                      }),
                                      Object(u.jsx)(hi, {
                                        handleModifyOpen: e.handleModifyOpen,
                                        confirm_action: e.handleModifyProject,
                                        confirm_text: "Update",
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)(oi.c, {
                                    children: [
                                      Object(u.jsx)("div", {
                                        style: {
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginLeft: "1vw",
                                          marginBottom: "2vh",
                                          width: "100%",
                                        },
                                        children: Object(u.jsx)(xt, {
                                          TableCard: !0,
                                          style: {
                                            boxShadow: "1px 1px 6px 2px gray",
                                            width: "45vw",
                                          },
                                          children: Object(u.jsxs)(jt.a, {
                                            children: [
                                              Object(u.jsx)(Rt, {
                                                headLabel: mt,
                                              }),
                                              Object(u.jsx)(dt.a, {
                                                children:
                                                  e.projectUsers &&
                                                  e.projectUsers
                                                    .slice(i * r, i * r + r)
                                                    .map(function (t) {
                                                      var n = t.id,
                                                        i = t.name,
                                                        a = t.role,
                                                        c = t.assigned_projects,
                                                        s = t.assigned;
                                                      return (
                                                        console.log(
                                                          n,
                                                          e.userSelected
                                                        ),
                                                        Object(u.jsxs)(
                                                          Ot,
                                                          {
                                                            sx: {
                                                              "&:hover": {
                                                                backgroundColor:
                                                                  "rgba(145, 165, 172, 0.5)",
                                                                cursor:
                                                                  "pointer",
                                                              },
                                                            },
                                                            align: "center",
                                                            tabIndex: -1,
                                                            onClick:
                                                              function () {
                                                                return e.handleSetUserSelected(
                                                                  n,
                                                                  s
                                                                );
                                                              },
                                                            selected:
                                                              e.userSelected ===
                                                              n,
                                                            children: [
                                                              Object(u.jsx)(
                                                                wt,
                                                                { entry: i },
                                                                i
                                                              ),
                                                              Object(u.jsx)(
                                                                wt,
                                                                { entry: a },
                                                                a
                                                              ),
                                                              Object(u.jsx)(
                                                                wt,
                                                                { entry: s },
                                                                s
                                                              ),
                                                              Object(u.jsx)(
                                                                wt,
                                                                { entry: c },
                                                                c
                                                              ),
                                                            ],
                                                          },
                                                          n
                                                        )
                                                      );
                                                    }),
                                              }),
                                            ],
                                          }),
                                        }),
                                      }),
                                      Object(u.jsx)(hi, {
                                        handleModifyOpen: e.handleModifyOpen,
                                        confirm_action: e.handleAssignUser,
                                        confirm_text: e.assignmentButtonText,
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)(oi.c, {
                                    children: [
                                      Object(u.jsxs)("div", {
                                        style: {
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginLeft: "1vw",
                                        },
                                        children: [
                                          Object(u.jsx)(kt, {
                                            title_text: "Project Visibility:",
                                          }),
                                          Object(u.jsx)("span", {
                                            style: { width: "3vw" },
                                          }),
                                          Object(u.jsx)(At, {
                                            subtitle_text: "Public:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "radio",
                                            value: "public",
                                            name: "public",
                                            defaultChecked:
                                              !0 ===
                                              e.projectSelectedDetails
                                                .visibility,
                                            onChange: function () {
                                              return e.handleToggleVisibility();
                                            },
                                            checked: !0 === e.visibility,
                                          }),
                                          Object(u.jsx)("span", {
                                            style: { width: "5vw" },
                                          }),
                                          Object(u.jsx)(At, {
                                            subtitle_text: "Private:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "radio",
                                            value: "private",
                                            name: "private",
                                            onChange: function () {
                                              return e.handleToggleVisibility();
                                            },
                                            checked: !1 === e.visibility,
                                            style: { marginRight: "6.5vw" },
                                          }),
                                        ],
                                      }),
                                      Object(u.jsxs)("div", {
                                        style: {
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginLeft: "1vw",
                                        },
                                        children: [
                                          Object(u.jsx)(kt, {
                                            title_text: "Project Status:",
                                          }),
                                          Object(u.jsx)("span", {
                                            style: { width: "3vw" },
                                          }),
                                          Object(u.jsx)(At, {
                                            subtitle_text: "Active:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "radio",
                                            value: "Active",
                                            name: "active",
                                            defaultChecked:
                                              !0 ===
                                              e.projectSelectedDetails
                                                .visibility,
                                            onChange: function () {
                                              return e.handleSetProjectStatus();
                                            },
                                            checked: !0 === e.projectStatus,
                                          }),
                                          Object(u.jsx)("span", {
                                            style: { width: "5vw" },
                                          }),
                                          Object(u.jsx)(At, {
                                            subtitle_text: "Inactive:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "radio",
                                            value: "inactive",
                                            name: "inactive",
                                            onChange: function () {
                                              return e.handleSetProjectStatus();
                                            },
                                            checked: !1 === e.projectStatus,
                                            style: { marginRight: "6.5vw" },
                                          }),
                                        ],
                                      }),
                                      Object(u.jsxs)("div", {
                                        style: {
                                          display: "flex",
                                          flexDirection: "row",
                                          alignItems: "center",
                                          marginLeft: "1vw",
                                        },
                                        children: [
                                          Object(u.jsx)(kt, {
                                            title_text: "Difficulty:",
                                          }),
                                          Object(u.jsxs)("select", {
                                            value: e.projectDifficulty,
                                            style: { marginRight: "1vw" },
                                            onChange:
                                              e.handleSetProjectDifficulty,
                                            children: [
                                              Object(u.jsx)("option", {
                                                value: "Easy",
                                                onChange: function (t) {
                                                  return e.setProjectDifficulty(
                                                    t
                                                  );
                                                },
                                                children: "Easy",
                                              }),
                                              Object(u.jsx)("option", {
                                                value: "Intermediate",
                                                onChange: function (t) {
                                                  return e.setProjectDifficulty(
                                                    t
                                                  );
                                                },
                                                children: "Intermediate",
                                              }),
                                              Object(u.jsx)("option", {
                                                value: "Hard",
                                                onChange: function (t) {
                                                  return e.setProjectDifficulty(
                                                    t
                                                  );
                                                },
                                                children: "Hard",
                                              }),
                                            ],
                                          }),
                                          Object(u.jsx)(kt, {
                                            title_text: "Max Editors:",
                                          }),
                                          Object(u.jsx)("input", {
                                            type: "number",
                                            min: "1",
                                            step: "1",
                                            value: e.maxEditors,
                                            onChange: e.handleSetMaxEditors,
                                          }),
                                        ],
                                      }),
                                      Object(u.jsx)(hi, {
                                        handleModifyOpen: e.handleModifyOpen,
                                        confirm_action: e.handleModifyProject,
                                        confirm_text: "Update",
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            }),
                          ],
                        }),
                      },
                      "modify"
                    )
                  : Object(u.jsx)(u.Fragment, {}),
            })
          );
        },
        hi = function (e) {
          return Object(u.jsxs)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              textAlign: "center",
              justifyContent: "center",
            },
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.handleModifyOpen,
                cancel_text: "Cancel",
              }),
              Object(u.jsx)(_t, {
                confirm_action: e.confirm_action,
                confirm_text: e.confirm_text,
              }),
            ],
          });
        },
        gi = function (e) {
          return Object(u.jsx)("div", {
            style: { overflowY: "scroll", width: "85vw", height: "83vh" },
            children: Object(u.jsx)(li.a, {
              sx: {
                height: "auto",
                position: "relative",
                top: "3vh",
                left: "3vw",
              },
              container: !0,
              spacing: 3,
              children:
                e.projects &&
                e.projects.slice().map(function (t) {
                  var n = t.id,
                    i = t.name,
                    a = t.difficulty,
                    c = t.visibility,
                    s = t.total_payout,
                    r = t.rate_per_task,
                    o = t.max_editors,
                    l = t.total_editors,
                    j = t.total_tasks,
                    d = t.tasks_mapped,
                    b = t.tasks_validated,
                    x = t.tasks_invalidated,
                    h = t.url,
                    g = t.source,
                    O = t.max_payment;
                  return Object(u.jsx)(Oi, {
                    id: n,
                    url: h,
                    name: i,
                    difficulty: a,
                    visibility: c,
                    max_editors: o,
                    total_editors: l,
                    total_tasks: j,
                    rate_per_task: r,
                    tasks_mapped: d,
                    tasks_validated: b,
                    tasks_invalidated: x,
                    total_payout: s,
                    max_payment: O,
                    projectSelected: e.projectSelected,
                    source: g,
                    goToSource: e.goToSource,
                    handleSetProjectSelected: e.handleSetProjectSelected,
                  });
                }),
            }),
          });
        },
        Oi = function (e) {
          return Object(u.jsxs)(
            nt.a,
            {
              style: {
                boxShadow: "1px 1px 6px 2px gray",
                width: "25vw",
                height: "56vh",
                marginLeft: "2vw",
                marginTop: "2vh",
              },
              onDoubleClick: function () {
                return e.goToSource(e.url);
              },
              children: [
                Object(u.jsx)(ji, {
                  children: Object(u.jsx)("input", {
                    type: "checkbox",
                    id: e.id,
                    value: e.id,
                    checked: e.id === e.projectSelected,
                    onChange: function (t) {
                      return e.handleSetProjectSelected(t);
                    },
                    style: { marginLeft: "1vw", marginBottom: "1vh" },
                  }),
                }),
                Object(u.jsx)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    height: "10vh",
                  },
                  children: Object(u.jsx)(kt, { title_text: e.name }),
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsx)(At, {
                      subtitle_text: "Difficulty: ".concat(e.difficulty),
                    }),
                    Object(u.jsx)(At, {
                      subtitle_text: "Visibility: ".concat(
                        !0 === e.visibility ? "Public" : "Private"
                      ),
                    }),
                  ],
                }),
                Object(u.jsx)(At, {
                  subtitle_text: "Source: ".concat(
                    "tasks" === e.source ? "TM4" : "TM3"
                  ),
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Mapped %:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "".concat(
                            (e.total_tasks / 100) * e.tasks_mapped,
                            "%"
                          ),
                        }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Validated %:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "".concat(
                            (e.total_tasks / 100) * e.tasks_validated,
                            "%"
                          ),
                        }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Editors:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: ""
                            .concat(e.total_editors, "/")
                            .concat(e.max_editors),
                        }),
                      ],
                    }),
                  ],
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Tasks Mapped:" }),
                        Object(u.jsx)(At, { subtitle_text: e.tasks_mapped }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, {
                          subtitle_text: "Tasks Validated:",
                        }),
                        Object(u.jsx)(At, { subtitle_text: e.tasks_validated }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Current Payout:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "$".concat(e.total_payout),
                        }),
                      ],
                    }),
                  ],
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Total Tasks:" }),
                        Object(u.jsx)(At, { subtitle_text: e.total_tasks }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Rate/Task:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "$".concat(e.rate_per_task),
                        }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Total Budget:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "$".concat(e.max_payment),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            },
            e.id
          );
        },
        pi = function () {
          var e = Object(a.useContext)(m),
            t = e.refresh,
            n = e.user,
            i = Object(a.useContext)(ye),
            c = i.calculateProjectBudget,
            s = i.createProject,
            r = i.sidebarOpen,
            l = i.handleSetSidebarState,
            d = i.outputRate,
            b = i.fetchOrgProjects,
            x = i.activeProjects,
            h = i.inactiveProjects,
            g = i.fetchProjectUsers,
            O = i.projectUsers,
            p = i.deleteProject,
            f = i.findObjectById,
            v = i.projectSelectedDetails,
            y = i.setProjectSelectedDetails,
            w = i.handleOutputRate,
            S = i.updateProject,
            _ = i.userSelected,
            k = i.setUserSelected,
            A = i.generateRandomKey,
            P = i.goToSource,
            D = i.assignUserProject,
            R = i.unassignUserProject,
            T = Object(a.useState)(!1),
            E = Object(o.a)(T, 2),
            I = E[0],
            L = E[1],
            B = Object(a.useState)(null),
            U = Object(o.a)(B, 2),
            M = U[0],
            F = U[1],
            Y = Object(a.useState)(0),
            N = Object(o.a)(Y, 2),
            q = N[0],
            z = N[1],
            K = Object(a.useState)(1),
            V = Object(o.a)(K, 2),
            H = V[0],
            W = V[1],
            Q = C(!0),
            G = Object(o.a)(Q, 2),
            J = G[0],
            X = G[1],
            Z = C(!1),
            $ = Object(o.a)(Z, 2),
            ee = $[0],
            te = $[1],
            ne = C(!1),
            ie = Object(o.a)(ne, 2),
            ae = ie[0],
            ce = ie[1],
            se = C(!1),
            re = Object(o.a)(se, 2),
            oe = re[0],
            le = re[1],
            je = C(!0),
            de = Object(o.a)(je, 2),
            ue = de[0],
            be = de[1],
            xe = Object(a.useState)(null),
            he = Object(o.a)(xe, 2),
            ge = he[0],
            Oe = he[1],
            pe = Object(a.useState)(null),
            fe = Object(o.a)(pe, 2),
            me = fe[0],
            ve = fe[1],
            we = Object(a.useState)(null),
            Se = Object(o.a)(we, 2),
            _e = Se[0],
            ke = Se[1],
            Ae = C(!1),
            Ce = Object(o.a)(Ae, 2),
            Pe = Ce[0],
            De = Ce[1],
            Re = Object(a.useState)(1),
            Te = Object(o.a)(Re, 2),
            Ee = Te[0],
            Ie = Te[1],
            Le = Object(a.useState)("Assign"),
            Be = Object(o.a)(Le, 2),
            Ue = Be[0],
            Me = Be[1];
          Object(a.useEffect)(function () {
            n && t(),
              null === n && L(!0),
              null !== n && "admin" !== n.role && L(!0),
              b();
          }, []);
          var Fe = function (e) {
              Ie(e.target.value);
            },
            Ye = function () {
              te(!ee);
            },
            Ne = function () {
              null !== ge && ce();
            },
            qe = function () {
              var e;
              null !== ge &&
                ((e = f(1 === Ee ? x : h, ge)),
                ze(e.status),
                z(e.rate_per_task),
                W(e.max_editors),
                ve(e.difficulty),
                y(e),
                le());
            },
            ze = function (e) {
              null !== e ? De(e) : De();
            },
            Ke = function (e) {
              W(e.target.value);
            },
            Ve = function (e) {
              z(e.target.value);
            },
            He = function (e) {
              X();
            },
            We = function (e) {
              be();
            },
            Qe = function (e) {
              c(M, ue, q, ge);
            },
            Ge = function (e) {
              s(M, ue, q, H, J), Ye();
            },
            Je = function (e) {
              Oe(parseInt(e.target.value));
            };
          return Object(u.jsxs)(u.Fragment, {
            children: [
              Object(u.jsx)(di, {
                addOpen: ee,
                handleAddOpen: Ye,
                url: M,
                handleSetUrl: function (e) {
                  F(e.target.value);
                },
                rate: q,
                handleSetRate: Ve,
                maxEditors: H,
                handleSetMaxEditors: Ke,
                visibility: J,
                handleToggleVisibility: He,
                rateMethod: ue,
                handleToggleRateMethod: We,
                outputRate: d,
                handleCalculateRate: Qe,
                handleCreateProject: Ge,
              }),
              Object(u.jsx)(ui, {
                deleteOpen: ae,
                handleDeleteOpen: Ne,
                projectSelected: ge,
                handleDeleteProject: function () {
                  p(ge), Ne();
                },
              }),
              Object(u.jsx)(xi, {
                modifyOpen: oe,
                handleModifyOpen: qe,
                projectSelected: ge,
                projectDifficulty: me,
                setProjectDifficulty: ve,
                rateMethod: ue,
                handleToggleRateMethod: We,
                outputRate: d,
                visibility: J,
                handleCalculateRate: Qe,
                handleCreateProject: Ge,
                rate: q,
                maxEditors: H,
                handleSetRate: Ve,
                handleModifyProject: function () {
                  S(ge, ue, q, H, J, me, Pe), qe();
                },
                projectSelectedDetails: v,
                handleSetMaxEditors: Ke,
                handleSetProjectDifficulty: function (e) {
                  ve(e.target.value);
                },
                handleToggleVisibility: He,
                handleOutputRate: w,
                fetchProjectUsers: g,
                projectUsers: O,
                userSelected: _,
                handleSetUserSelected: function (e, t) {
                  k(e), ke(t), Me("Yes" === t ? "Unassign" : "Assign");
                },
                generateRandomKey: A,
                assignmentButtonText: Ue,
                assignmentStatus: _e,
                handleAssignUser: function () {
                  "No" === _e ? D(ge, _) : (console.log("unassign"), R(ge, _));
                },
                projectStatus: Pe,
                handleSetProjectStatus: ze,
              }),
              Object(u.jsxs)("div", {
                style: { width: "100%", float: "left" },
                children: [
                  Object(u.jsx)(Zt, {
                    isOpen: r,
                    toggleSidebar: function () {
                      l();
                    },
                  }),
                  Object(u.jsxs)("div", {
                    style: {
                      display: "flex",
                      position: "relative",
                      left: "15vw",
                      flexDirection: "column",
                      height: "100vh",
                    },
                    children: [
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          marginLeft: "6vh",
                          flexDirection: "row",
                        },
                        children: [
                          Object(u.jsx)("h1", {
                            style: { marginTop: "1vw", paddingBottom: "2vh" },
                            children: "Projects:",
                          }),
                          Object(u.jsx)("div", {
                            style: {
                              marginTop: "1vw",
                              position: "relative",
                              left: "41.5vw",
                            },
                            children: Object(u.jsx)(Dt, {
                              role: "admin",
                              button1: !0,
                              button2: !0,
                              button3: !0,
                              button1_text: "Add",
                              button2_text: "Edit",
                              button3_text: "Delete",
                              button1_action: Ye,
                              button2_action: qe,
                              button3_action: Ne,
                            }),
                          }),
                        ],
                      }),
                      Object(u.jsxs)(oi.d, {
                        children: [
                          Object(u.jsxs)(oi.b, {
                            style: {
                              marginLeft: "3vw",
                              marginTop: "0vh",
                              paddingTop: "0vh",
                            },
                            children: [
                              Object(u.jsx)(oi.a, {
                                value: 1,
                                onClick: function (e) {
                                  return Fe(e);
                                },
                                children: "Active",
                              }),
                              Object(u.jsx)(oi.a, {
                                value: 2,
                                onClick: function (e) {
                                  return Fe(e);
                                },
                                children: "Inactive",
                              }),
                            ],
                          }),
                          Object(u.jsx)(oi.c, {
                            children: Object(u.jsx)(
                              gi,
                              {
                                goToSource: P,
                                projects: x,
                                handleSetProjectSelected: Je,
                                projectSelected: ge,
                              },
                              1
                            ),
                          }),
                          Object(u.jsx)(oi.c, {
                            children: Object(u.jsx)(
                              gi,
                              {
                                goToSource: P,
                                projects: h,
                                handleSetProjectSelected: Je,
                                projectSelected: ge,
                              },
                              1
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              I
                ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                : Object(u.jsx)(u.Fragment, {}),
            ],
          });
        },
        fi =
          (n(181),
          n(121),
          Pe.b.img(
            mn ||
              (mn = Object(Ce.a)([
                "\n  width: 5%;\n  height: 3%;\n  opacity: 0.8;\n  transform-origin: bottom;\n  transform: rotate(",
                ");\n",
              ])),
            function (e) {
              return e.rotation;
            }
          ),
          Pe.b.div(
            vn ||
              (vn = Object(Ce.a)([
                "\n  top: 50%;\n  right: 1.5rem;\n  position: absolute;\n  /* bottom: 90px;\n  right: 14px; */\n  width: auto;\n  height: auto;\n  pointer-events: none;\n  z-index: 999;\n  background: rgba(66, 71, 75, 0.6);\n",
              ]))
          ),
          Pe.b.div(
            yn ||
              (yn = Object(Ce.a)([
                "\n  border-radius: 25px;\n  width: 75%;\n  height: 25px;\n  pointer-events: auto;\n  background-color: rgba(145, 165, 172, 0.5);\n  cursor: pointer;\n",
              ]))
          ),
          Pe.b.div(
            wn ||
              (wn = Object(Ce.a)([
                "\n  position: relative;\n  margin: auto;\n  width: 25px;\n  height: 25px;\n  border: none;\n",
              ]))
          ),
          Pe.b.div(
            Sn ||
              (Sn = Object(Ce.a)([
                "\n  position: absolute;\n  margin: auto;\n  left: 95%;\n  top: 25rem;\n  background-color: black;\n  color: white;\n  font-weight: bold;\n  border-radius: 6px;\n  font-size: 0.6vw;\n  z-index: 1;\n",
              ]))
          ),
          Pe.b.div(
            _n ||
              (_n = Object(Ce.a)([
                "\n  position: absolute;\n  margin: auto;\n  right: 2rem;\n  top: 20%;\n  background-color: white;\n  font-weight: bold;\n  border-radius: 6px;\n  font-size: 0.6vw;\n  z-index: 1;\n",
              ]))
          ),
          Pe.b.label(
            kn ||
              (kn = Object(Ce.a)([
                "\n  color: white;\n  font-weight: bold;\n  text-size-adjust: auto;\n  z-index: 1;\n  &:hover {\n    opacity: 0.7;\n    cursor: pointer;\n  }\n",
              ]))
          ),
          Pe.b.button(
            An ||
              (An = Object(Ce.a)([
                "\n  top: 1%;\n  right: 1%;\n  font-size: 20px;\n  position: absolute;\n  background-color: black;\n  color: white;\n  border: none;\n  margin-right: 3px;\n  margin-top: 3px;\n  border-radius: 50%;\n  max-width: 4vw;\n  max-height: 4vh;\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);\n  &:hover {\n    background-color: white;\n    color: black;\n  }\n",
              ]))
          ),
          Pe.b.div(
            Cn ||
              (Cn = Object(Ce.a)([
                "\n  bottom: 60px;\n  left: 1154px;\n  transform-origin: 100% 100%;\n",
              ]))
          ),
          Pe.b.div(
            Pn ||
              (Pn = Object(Ce.a)([
                "\n  bottom: 26.5rem;\n  right: 2rem;\n  position: absolute;\n  box-sizing: border-box;\n  background-color: white;\n  border-radius: 6px;\n",
              ]))
          ),
          Pe.b.div(
            Dn ||
              (Dn = Object(Ce.a)([
                "\n  /* width: 200px; */\n  box-shadow: 0 22px 20px -16px var(--shadow-color);\n  font-size: 14px;\n  min-height: 160px;\n  padding: 0.5rem;\n",
              ]))
          ),
          Pe.b.label(
            Rn ||
              (Rn = Object(Ce.a)([
                "\n  cursor: pointer;\n  margin-bottom: 0.5rem;\n  display: block;\n  font-size: 14px;\n",
              ]))
          ),
          Pe.b.input(
            Tn || (Tn = Object(Ce.a)(["\n  margin-right: 0.5rem;\n"]))
          ),
          Pe.b.div(
            En ||
              (En = Object(Ce.a)([
                "\n  /* bottom: 95px;\n  border-left-color: white;\n  border-bottom-color: transparent;\n  border-bottom-width: 0;\n  border-top-width: 5rem;\n  right: 0;\n  border-right-color: transparent;\nborder-top-color: transparent;\nborder-left-width: 5rem;\nborder-right-width: 0;\nborder-style: solid;\nheight: 0;\nposition: absolute;\nwidth: 0;\nbackground-color:red;\nz-index: 9999; */\n",
              ]))
          ),
          Pe.b.input(
            In ||
              (In = Object(Ce.a)([
                "\n  box-sizing: inherit;\n  font-family: sans-serif;\n  font-size: 100%;\n  line-height: 1.15;\n  overflow: visible;\n  width: 90%;\n  display: flex;\n  align-self: center;\n  padding: 12px 20px;\n  margin: 8px 0;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n",
              ]))
          )),
        mi =
          (Pe.b.div(
            Ln ||
              (Ln = Object(Ce.a)([
                "\n  margin-left: 2em;\n  margin-right: 2em;\n",
              ]))
          ),
          Object(Xe.a)("div")(function () {
            return {
              display: "flex",
              flexDirection: "row",
              margin: "auto",
              alignItems: "center",
              justifyContent: "center",
              justifyItems: "center",
              marginBottom: "2vh",
              marginTop: "2vh",
            };
          })),
        vi = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.addOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleAddOpen }),
                  Object(u.jsx)(kt, { title_text: "Invite a new user" }),
                  Object(u.jsx)(At, {
                    subtitle_text:
                      "An invitation to join Mikro under your organization will be sent to the email address entered below",
                  }),
                  Object(u.jsx)(at.a, {}),
                  Object(u.jsx)(wi, {
                    handleSetInviteEmail: e.handleSetInviteEmail,
                  }),
                  Object(u.jsx)(at.a, {}),
                  Object(u.jsx)(yi, {
                    form: e.form,
                    do_invite_user: e.do_invite_user,
                    handleAddOpen: e.handleAddOpen,
                  }),
                ],
              }),
            },
            "add"
          );
        },
        yi = function (e) {
          return Object(u.jsxs)(gt, {
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.handleAddOpen,
                cancel_text: "Cancel",
              }),
              Object(u.jsx)(_t, {
                confirm_text: "Send",
                confirm_action: e.do_invite_user,
              }),
            ],
          });
        },
        wi = function (e) {
          return Object(u.jsxs)(u.Fragment, {
            children: [
              Object(u.jsx)(kt, {
                text: "Email Address:",
                style: { marginBottom: "2vh" },
              }),
              Object(u.jsx)(fi, {
                style: { marginLeft: "2.5vw", marginBottom: "2vh" },
                type: "text",
                name: "name",
                placeholder: "InviteUser@mikro.com",
                onChange: function (t) {
                  e.handleSetInviteEmail(t.target.value);
                },
              }),
            ],
          });
        },
        Si = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.deleteOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { action: e.handleDeleteOpen }),
                  Object(u.jsx)(kt, { title_text: "Remove a user" }),
                  Object(u.jsx)(At, {
                    subtitle_text: "User - ".concat(
                      e.selected_user,
                      "  will be removed from your organization"
                    ),
                  }),
                  Object(u.jsx)(at.a, {}),
                  Object(u.jsx)(_i, {
                    form: e.form,
                    do_remove_user: e.do_remove_user,
                    handleDeleteOpen: e.handleDeleteOpen,
                  }),
                ],
              }),
            },
            "add"
          );
        },
        _i = function (e) {
          return Object(u.jsxs)(gt, {
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.handleDeleteOpen,
                cancel_text: "Cancel",
              }),
              Object(u.jsx)(_t, {
                confirm_text: "Remove",
                confirm_action: function () {
                  return e.do_remove_user(e.form);
                },
              }),
            ],
          });
        },
        ki = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.modifyOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleModifyOpen }),
                  Object(u.jsx)(kt, {
                    title_text:
                      "Edit the role of the selected user within your organization",
                  }),
                  Object(u.jsxs)(mi, {
                    children: [
                      Object(u.jsx)("input", {
                        type: "radio",
                        value: "Admin",
                        name: "role",
                        onChange: function () {
                          return e.handleRoleSelected("admin");
                        },
                        checked: "admin" === e.roleSelected,
                      }),
                      " ",
                      "Admin",
                      Object(u.jsx)("span", { style: { width: "5vw" } }),
                      Object(u.jsx)("input", {
                        type: "radio",
                        value: "User",
                        name: "role",
                        onChange: function () {
                          return e.handleRoleSelected("user");
                        },
                        checked: "user" === e.roleSelected,
                      }),
                      " ",
                      "User",
                    ],
                  }),
                  Object(u.jsx)(Ai, {
                    handleModifyOpen: e.handleModifyOpen,
                    do_modify_user: e.do_modify_user,
                  }),
                ],
              }),
            },
            "modify"
          );
        },
        Ai = function (e) {
          return Object(u.jsxs)(gt, {
            children: [
              Object(u.jsx)(St, {
                cancel_text: "Cancel",
                cancel_action: e.handleModifyOpen,
              }),
              Object(u.jsx)(_t, {
                confirm_text: "Confirm",
                confirm_action: e.do_modify_user,
              }),
            ],
          });
        },
        Ci = function () {
          var e = Object(a.useContext)(ye),
            t = e.orgUsers,
            n = e.fetchOrgUsers,
            i = e.inviteUser,
            c = e.removeUser,
            s = e.modifyUser,
            r = Object(a.useContext)(ye),
            l = r.sidebarOpen,
            d = r.handleSetSidebarState,
            b = Object(a.useContext)(m),
            x = b.refresh,
            h = b.user,
            g = Object(a.useState)(0),
            O = Object(o.a)(g, 2),
            p = O[0],
            f = O[1],
            v = Object(a.useState)(10),
            y = Object(o.a)(v, 2),
            w = y[0],
            S = y[1],
            _ = Object(a.useState)(!1),
            k = Object(o.a)(_, 2),
            A = k[0],
            P = k[1],
            D = C(!1),
            R = Object(o.a)(D, 2),
            T = R[0],
            E = R[1],
            I = C(!1),
            L = Object(o.a)(I, 2),
            B = L[0],
            U = L[1],
            M = C(!1),
            F = Object(o.a)(M, 2),
            Y = F[0],
            N = F[1],
            q = Object(a.useState)(null),
            z = Object(o.a)(q, 2),
            K = z[0],
            V = z[1],
            H = Object(a.useState)(null),
            W = Object(o.a)(H, 2),
            Q = W[0],
            G = W[1],
            J = Object(a.useState)(null),
            X = Object(o.a)(J, 2),
            Z = X[0],
            $ = X[1],
            ee = Object(a.useState)({ name: "", desc: "" }),
            te = Object(o.a)(ee, 2),
            ne = te[0],
            ie = te[1];
          Object(a.useEffect)(function () {
            h && x(),
              null === h && P(!0),
              null !== h && "admin" !== h.role && P(!0),
              n();
          }, []);
          var ae = function () {
              E(!T);
            },
            ce = function () {
              null !== K && U();
            },
            se = function () {
              null !== K && N();
            };
          return Object(u.jsxs)(u.Fragment, {
            children: [
              Object(u.jsx)(vi, {
                addOpen: T,
                form: ne,
                handleAddOpen: ae,
                handleSetInviteEmail: function (e) {
                  $(e);
                },
                setForm: ie,
                do_invite_user: function () {
                  Z && (i(Z), alert("Invitation Email Sent"), E());
                },
              }),
              Object(u.jsx)(Si, {
                deleteOpen: B,
                selected_user: K,
                handleDeleteOpen: ce,
                do_remove_user: function () {
                  K && (c(K), U());
                },
              }),
              Object(u.jsx)(ki, {
                modifyOpen: Y,
                roleSelected: Q,
                handleModifyOpen: se,
                handleRoleSelected: function (e) {
                  G(e);
                },
                do_modify_user: function () {
                  K && (s(K, Q), N());
                },
              }),
              Object(u.jsxs)("div", {
                style: { width: "100%", float: "left" },
                children: [
                  Object(u.jsx)(Zt, {
                    isOpen: l,
                    toggleSidebar: function () {
                      d();
                    },
                  }),
                  Object(u.jsxs)("div", {
                    style: {
                      display: "flex",
                      position: "relative",
                      left: "15vw",
                      flexDirection: "column",
                      height: "100vh",
                    },
                    children: [
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          marginLeft: "5vh",
                          flexDirection: "row",
                        },
                        children: [
                          Object(u.jsx)("h1", {
                            style: {
                              marginLeft: ".5vw",
                              marginTop: "1vw",
                              paddingBottom: "2vh",
                            },
                            children: "Users:",
                          }),
                          Object(u.jsx)("div", {
                            style: {
                              marginTop: "1vw",
                              position: "relative",
                              left: "44vw",
                            },
                            children: Object(u.jsx)(Dt, {
                              role: "admin",
                              button1: !0,
                              button2: !0,
                              button3: !0,
                              button1_text: "Add",
                              button2_text: "Edit",
                              button3_text: "Delete",
                              button1_action: ae,
                              button2_action: se,
                              button3_action: ce,
                            }),
                          }),
                        ],
                      }),
                      Object(u.jsx)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          marginLeft: "3vw",
                          marginTop: "1vw",
                          height: "82%",
                          width: "79vw",
                        },
                        children: Object(u.jsxs)(xt, {
                          style: { boxShadow: "1px 1px 6px 2px gray" },
                          children: [
                            Object(u.jsx)(bt, {}),
                            Object(u.jsxs)(jt.a, {
                              children: [
                                Object(u.jsx)(Rt, { headLabel: ft }),
                                Object(u.jsx)(dt.a, {
                                  children:
                                    t &&
                                    t.slice(p * w, p * w + w).map(function (e) {
                                      var t = e.id,
                                        n = e.name,
                                        i = e.role,
                                        a = e.assigned_projects,
                                        c = e.total_tasks_mapped,
                                        s = e.total_tasks_validated,
                                        r = e.total_tasks_invalidated,
                                        o = e.awaiting_payment,
                                        l = e.total_payout;
                                      return Object(u.jsxs)(
                                        Ot,
                                        {
                                          sx: {
                                            "&:hover": {
                                              backgroundColor:
                                                "rgba(145, 165, 172, 0.5)",
                                              cursor: "pointer",
                                            },
                                          },
                                          align: "center",
                                          tabIndex: -1,
                                          onClick: function () {
                                            return (function (e) {
                                              V(e);
                                            })(t);
                                          },
                                          selected: K === t,
                                          children: [
                                            Object(u.jsx)(wt, { entry: n }),
                                            Object(u.jsx)(wt, { entry: i }),
                                            Object(u.jsx)(wt, { entry: a }),
                                            Object(u.jsx)(wt, { entry: c }),
                                            Object(u.jsx)(wt, { entry: s }),
                                            Object(u.jsx)(wt, { entry: r }),
                                            Object(u.jsx)(wt, { entry: o }),
                                            Object(u.jsx)(wt, { entry: l }),
                                          ],
                                        },
                                        e
                                      );
                                    }),
                                }),
                              ],
                            }),
                            Object(u.jsx)(ut.a, {
                              style: { width: "100%" },
                              rowsPerPageOptions: [5, 10, 15],
                              component: "div",
                              count: t ? t.length : 5,
                              rowsPerPage: w,
                              page: p,
                              onPageChange: function (e, t) {
                                return f(t);
                              },
                              onRowsPerPageChange: function (e) {
                                return (function (e) {
                                  S(e.target.value);
                                })(e);
                              },
                            }),
                          ],
                        }),
                      }),
                    ],
                  }),
                ],
              }),
              A
                ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                : Object(u.jsx)(u.Fragment, {}),
            ],
          });
        },
        Pi =
          (n(194),
          function (e) {
            return Object(u.jsx)(
              lt.a,
              {
                open: e.addOpen,
                children: Object(u.jsxs)(ht, {
                  children: [
                    Object(u.jsx)(Ct, { close_action: e.handleAddOpen }),
                    Object(u.jsx)(kt, { title_text: "Add New Pay Request" }),
                    Object(u.jsx)(At, {
                      subtitle_text:
                        "Enter the Username, payment email request amount and task IDs for this request.",
                    }),
                    Object(u.jsx)(at.a, {}),
                    Object(u.jsx)("div", {
                      style: { display: "flex", flexDirection: "column" },
                      children: Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "User ID:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.userID,
                            onChange: function (t) {
                              return e.handleSetUserID(t);
                            },
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                    }),
                    Object(u.jsx)(at.a, {}),
                    Object(u.jsxs)("div", {
                      style: { display: "flex", flexDirection: "column" },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            marginLeft: "1vw",
                            width: "100%",
                          },
                          children: [
                            Object(u.jsx)(kt, {
                              title_text: "Request Amount:",
                            }),
                            Object(u.jsx)("input", {
                              type: "number",
                              min: "0.01",
                              step: "0.01",
                              value: e.requestAmount,
                              onChange: function (t) {
                                return e.handleSetRequestAmount(t);
                              },
                              style: {
                                height: "5vh",
                                marginRight: "3vw",
                                width: "95%",
                              },
                            }),
                          ],
                        }),
                        Object(u.jsx)(at.a, {}),
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            alignItems: "center",
                            marginLeft: "1vw",
                            width: "100%",
                          },
                          children: [
                            Object(u.jsx)(kt, { title_text: "Task IDs:" }),
                            Object(u.jsx)("input", {
                              type: "text",
                              value: e.taskIDs,
                              onChange: function (t) {
                                return e.handleSetTaskIds(t);
                              },
                              style: {
                                height: "5vh",
                                marginRight: "3vw",
                                width: "95%",
                              },
                              placeholder: "Task IDS separated by commas",
                            }),
                          ],
                        }),
                      ],
                    }),
                    Object(u.jsx)(Di, {
                      confirm_text: "Add",
                      confirm_action: e.handleCreateTransactions,
                      cancel_action: e.handleAddOpen,
                    }),
                  ],
                }),
              },
              "add"
            );
          }),
        Di = function (e) {
          return Object(u.jsxs)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              textAlign: "center",
              justifyContent: "center",
            },
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.cancel_action,
                cancel_text: "Cancel",
              }),
              Object(u.jsx)(_t, {
                confirm_action: e.confirm_action,
                confirm_text: e.confirm_text,
              }),
            ],
          });
        },
        Ri = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.deleteOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleDeleteOpen }),
                  Object(u.jsx)(kt, { title_text: e.title_text }),
                  Object(u.jsx)(Di, {
                    confirm_text: "Delete",
                    cancel_action: e.handleDeleteOpen,
                    confirm_action: e.handleDeleteRequest,
                  }),
                ],
              }),
            },
            "delete"
          );
        },
        Ti = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.detailsOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleDetailsOpen }),
                  Object(u.jsx)(kt, { title_text: e.title_text }),
                  Object(u.jsxs)("div", {
                    style: { display: "flex", flexDirection: "column" },
                    children: [
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "User:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.user_name,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                          Object(u.jsx)(kt, { title_text: "Payment Amount:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: "$".concat(e.amount_paid),
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Date Paid:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.date_paid,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                          Object(u.jsx)(kt, { title_text: "Payoneer ID:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.payoneer_id,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "35%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Payment Email:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.payment_email,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Task IDs:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.task_ids,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                          marginBottom: "2vh",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Notes:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.notes,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            },
            "delete"
          );
        },
        Ei = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.processOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleProcessOpen }),
                  Object(u.jsx)(kt, { title_text: e.title_text }),
                  Object(u.jsxs)("div", {
                    style: { display: "flex", flexDirection: "column" },
                    children: [
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "User Requesting Payment:",
                          }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.userName,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95vw",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Amount Requested:",
                          }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: "$".concat(e.requestAmount),
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "15vw",
                            },
                          }),
                          Object(u.jsx)(kt, { title_text: "Date Requested:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.requestDate,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "20vw",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Payment Email:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.payEmail,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "15vw",
                            },
                          }),
                          Object(u.jsx)(kt, { title_text: "Task IDs:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.taskIDs,
                            onChange: function (t) {
                              return e.handleSetTaskIds(t);
                            },
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "20vw",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Payoneer transaction ID:",
                          }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.payoneerID,
                            onChange: function (t) {
                              return e.handleSetPayoneerID(t);
                            },
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Transaction Notes:",
                          }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.notes,
                            onChange: function (t) {
                              return e.handleSetNotes(t);
                            },
                            placeholder: "Limit 100 Characters",
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                  Object(u.jsx)(Di, {
                    confirm_text: "Process",
                    cancel_action: e.handleProcessOpen,
                    confirm_action: e.handleProcessPayRequest,
                  }),
                ],
              }),
            },
            "process"
          );
        },
        Ii = function () {
          var e = Object(a.useContext)(ye),
            t = e.sidebarOpen,
            n = e.handleSetSidebarState,
            i = e.orgPayments,
            c = e.orgRequests,
            s = e.fetchOrgTransactions,
            r = e.createTransaction,
            l = e.deleteTransaction,
            d = e.processPayRequest,
            b = e.CSVdata,
            x = Object(a.useContext)(m),
            h = x.refresh,
            g = x.user,
            O = Object(a.useState)(!1),
            p = Object(o.a)(O, 2),
            f = p[0],
            v = p[1],
            y = Object(a.useState)(0),
            w = Object(o.a)(y, 2),
            S = w[0],
            _ = w[1],
            k = Object(a.useState)(10),
            A = Object(o.a)(k, 2),
            P = A[0],
            D = A[1],
            R = C(!1),
            T = Object(o.a)(R, 2),
            E = T[0],
            I = T[1],
            L = C(!1),
            B = Object(o.a)(L, 2),
            U = B[0],
            M = B[1],
            F = C(!1),
            Y = Object(o.a)(F, 2),
            N = Y[0],
            q = Y[1],
            z = C(!1),
            K = Object(o.a)(z, 2),
            V = K[0],
            H = K[1],
            W = Object(a.useState)(null),
            Q = Object(o.a)(W, 2),
            G = Q[0],
            J = Q[1],
            X = Object(a.useState)(null),
            Z = Object(o.a)(X, 2),
            $ = Z[0],
            ee = Z[1],
            te = Object(a.useState)(null),
            ne = Object(o.a)(te, 2),
            ie = ne[0],
            ae = ne[1],
            ce = Object(a.useState)(null),
            se = Object(o.a)(ce, 2),
            re = se[0],
            oe = se[1],
            le = Object(a.useState)([]),
            je = Object(o.a)(le, 2),
            de = je[0],
            ue = je[1],
            be = Object(a.useState)(null),
            xe = Object(o.a)(be, 2),
            he = xe[0],
            ge = xe[1],
            Oe = Object(a.useState)(null),
            pe = Object(o.a)(Oe, 2),
            fe = pe[0],
            me = pe[1],
            ve = Object(a.useState)(null),
            we = Object(o.a)(ve, 2),
            Se = we[0],
            _e = we[1],
            ke = Object(a.useState)(null),
            Ae = Object(o.a)(ke, 2),
            Ce = Ae[0],
            Pe = Ae[1],
            De = Object(a.useState)(null),
            Re = Object(o.a)(De, 2),
            Te = Re[0],
            Ee = Re[1],
            Ie = Object(a.useState)(1),
            Le = Object(o.a)(Ie, 2),
            Be = Le[0],
            Ue = Le[1];
          Object(a.useEffect)(function () {
            g && h(),
              null === g && v(!0),
              null !== g && "admin" !== g.role && v(!0),
              s();
          }, []);
          var Me = function (e) {
              D(e.target.value);
            },
            Fe = function () {
              I(!E), ae(null), me(null), J(null), ue(null);
            },
            Ye = function () {
              null !== Se && M();
            },
            Ne = function () {
              null !== Se && q();
            },
            qe = function () {
              null !== Ce && H();
            },
            ze = function (e) {
              Ue(e.target.value);
            },
            Ke = function (e) {
              ue(e.target.value);
            };
          return Object(u.jsxs)(u.Fragment, {
            children: [
              Object(u.jsx)(Pi, {
                addOpen: E,
                handleAddOpen: Fe,
                requestAmount: fe,
                handleSetRequestAmount: function (e) {
                  me(e.target.value);
                },
                taskIDs: de,
                handleSetTaskIds: Ke,
                handleCreateTransactions: function () {
                  r($, fe, ie, de), Fe();
                },
                userID: $,
                handleSetUserID: function (e) {
                  ee(e.target.value);
                },
              }),
              Object(u.jsx)(Ri, {
                deleteOpen: U,
                handleDeleteOpen: Ye,
                title_text:
                  1 === Be
                    ? "Are you sure you want to delete Pay Request ".concat(
                        Se,
                        "?"
                      )
                    : "Are you sure you want to delete Payment ".concat(
                        Se,
                        "?"
                      ),
                handleDeleteRequest: function () {
                  var e = "payment";
                  1 === Be && (e = "request"), l(Se, e), Ye();
                },
              }),
              Object(u.jsx)(Ei, {
                processOpen: N,
                handleProcessOpen: Ne,
                title_text: "Process Pay Request ".concat(Se),
                userName: G,
                requestAmount: fe,
                requestDate: Te,
                payEmail: ie,
                taskIDs: de,
                handleSetTaskIds: Ke,
                handleProcessPayRequest: function () {
                  d(Se, $, fe, de, re, he), Ne();
                },
                payoneerID: re,
                handleSetPayoneerID: function (e) {
                  oe(e.target.value);
                },
                notes: he,
                handleSetNotes: function (e) {
                  ge(e.target.value);
                },
              }),
              Object(u.jsx)(Ti, {
                detailsOpen: V,
                handleDetailsOpen: qe,
                title_text: "Details for Payment ".concat(re),
                payoneer_id: re,
                user_name: G,
                date_paid: Te,
                payment_email: ie,
                amount_paid: fe,
                task_ids: de,
                notes: he,
              }),
              Object(u.jsxs)("div", {
                style: { width: "100%", float: "left" },
                children: [
                  Object(u.jsx)(Zt, {
                    isOpen: t,
                    toggleSidebar: function () {
                      n();
                    },
                  }),
                  Object(u.jsxs)("div", {
                    style: {
                      display: "flex",
                      position: "relative",
                      left: "15vw",
                      flexDirection: "column",
                      height: "100vh",
                    },
                    children: [
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          marginLeft: "6vh",
                          flexDirection: "row",
                        },
                        children: [
                          Object(u.jsx)("h1", {
                            style: { marginTop: "1vw", paddingBottom: "2vh" },
                            children: "Payments:",
                          }),
                          Object(u.jsx)("div", {
                            style: {
                              marginTop: "1vw",
                              position: "relative",
                              left: "38.5vw",
                            },
                            children: Object(u.jsx)(Dt, {
                              data: b,
                              button1: 1 === Be,
                              csv: 1 !== Be,
                              button2: !0,
                              button3: !0,
                              button1_text: 1 === Be ? "Add" : "CSV Report",
                              button2_text:
                                1 === Be ? "Process" : "View Details",
                              button3_text: "Delete",
                              button1_action: 1 === Be ? Fe : null,
                              button2_action: 1 === Be ? Ne : qe,
                              button3_action: Ye,
                            }),
                          }),
                        ],
                      }),
                      Object(u.jsxs)(oi.d, {
                        children: [
                          Object(u.jsxs)(oi.b, {
                            style: {
                              marginLeft: "3vw",
                              marginTop: "0vh",
                              paddingTop: "0vh",
                            },
                            children: [
                              Object(u.jsx)(oi.a, {
                                value: 1,
                                onClick: function (e) {
                                  return ze(e);
                                },
                                children: "Pay Requests",
                              }),
                              Object(u.jsx)(oi.a, {
                                value: 2,
                                onClick: function (e) {
                                  return ze(e);
                                },
                                children: "Completed Payouts",
                              }),
                            ],
                          }),
                          Object(u.jsx)(oi.c, {
                            children: Object(u.jsx)(It, {
                              rowsPerPage: P,
                              page: S,
                              setPage: _,
                              handleChangeRowsPerPage: Me,
                              orgRequests: c,
                              requestSelected: Se,
                              handleSetRequestSelected: function (
                                e,
                                t,
                                n,
                                i,
                                a,
                                c,
                                s
                              ) {
                                ee(n), _e(e), J(t), me(i), Ee(a), ae(c), ue(s);
                              },
                            }),
                          }),
                          Object(u.jsx)(oi.c, {
                            children: Object(u.jsx)(Lt, {
                              rowsPerPage: P,
                              page: S,
                              setPage: _,
                              handleChangeRowsPerPage: Me,
                              orgPayments: i,
                              paymentSelected: Ce,
                              handleSetPaymentSelected: function (
                                e,
                                t,
                                n,
                                i,
                                a,
                                c,
                                s,
                                r
                              ) {
                                Pe(e),
                                  ee(n),
                                  _e(e),
                                  J(t),
                                  me(i),
                                  Ee(a),
                                  ae(c),
                                  ue(s),
                                  oe(r);
                              },
                            }),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              f
                ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                : Object(u.jsx)(u.Fragment, {}),
            ],
          });
        },
        Li =
          (n(195),
          function () {
            var e = Object(a.useContext)(ye),
              t = e.firstName,
              n = e.lastName,
              i = e.OSMname,
              c = e.city,
              s = e.country,
              r = e.email,
              l = e.payEmail,
              d = e.sidebarOpen,
              b = e.fetchUserDetails,
              x = e.updateUserDetails,
              h = e.handleUserDetailsStates,
              g = e.handleSetSidebarState,
              O = Object(a.useContext)(m),
              p = O.refresh,
              f = O.user,
              v = Object(a.useState)(!1),
              y = Object(o.a)(v, 2),
              w = y[0],
              S = y[1],
              _ = C(!1),
              k = Object(o.a)(_, 2),
              A = k[0],
              P = k[1];
            Object(a.useEffect)(function () {
              f && p(),
                null === f && S(!0),
                null !== f && "admin" !== f.role && S(!0),
                b();
            }, []);
            var D = function () {
              P();
            };
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsx)(Et, {
                  modal_open: A,
                  handleOpenCloseModal: D,
                  interrogative:
                    "Are you sure you want to update these details?",
                  button_1_text: "Confirm",
                  button_1_action: function () {
                    x(), D();
                  },
                  button_2_text: "Cancel",
                  button_2_action: D,
                }),
                Object(u.jsxs)("div", {
                  style: { width: "100%", float: "left" },
                  children: [
                    Object(u.jsx)(Zt, {
                      isOpen: d,
                      toggleSidebar: function () {
                        g();
                      },
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        position: "relative",
                        left: "15vw",
                        flexDirection: "column",
                        height: "100vh",
                      },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            marginLeft: "5vh",
                            flexDirection: "row",
                          },
                          children: [
                            Object(u.jsx)("h1", {
                              style: {
                                marginLeft: ".5vw",
                                marginTop: "1vw",
                                paddingBottom: "2vh",
                              },
                              children: "Account:",
                            }),
                            Object(u.jsx)("div", {
                              style: {
                                marginTop: "1vw",
                                position: "relative",
                                top: "2vh",
                                left: "61.5vw",
                              },
                              children: Object(u.jsx)(Pt, {
                                button_text: "submit",
                                button_action: function () {
                                  D();
                                },
                              }),
                            }),
                          ],
                        }),
                        Object(u.jsx)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            marginLeft: "3vw",
                            marginTop: "1vw",
                            height: "82%",
                            width: "79vw",
                          },
                          children: Object(u.jsxs)(xt, {
                            style: { boxShadow: "1px 1px 6px 2px gray" },
                            children: [
                              Object(u.jsx)(bt, {}),
                              Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "row",
                                  height: "15vh",
                                  marginTop: "2vh",
                                  marginBottom: "2vh",
                                },
                                children: [
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "First Name:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: t,
                                        onChange: function (e) {
                                          return h("first_name", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "2vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Last Name:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: n,
                                        onChange: function (e) {
                                          return h("last_name", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "2vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "OSM Username:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: i,
                                        onChange: function (e) {
                                          return h("osm_name", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "2vw",
                                        },
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              Object(u.jsx)(at.a, {}),
                              Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "row",
                                  height: "15vh",
                                  marginTop: "2vh",
                                  marginBottom: "2vh",
                                },
                                children: [
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      marginLeft: "15vw",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "City:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: c,
                                        onChange: function (e) {
                                          return h("city", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Country:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: s,
                                        onChange: function (e) {
                                          return h("country", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              Object(u.jsx)(at.a, {}),
                              Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "row",
                                  height: "15vh",
                                  marginTop: "2vh",
                                  marginBottom: "2vh",
                                },
                                children: [
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      marginLeft: "7vw",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Personal Email:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: r,
                                        onChange: function (e) {
                                          return h("email", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Payment Email:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: l,
                                        onChange: function (e) {
                                          return h("pay_email", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                w
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        Bi =
          (n(196),
          function () {
            var e = Object(a.useContext)(ye),
              t = e.sidebarOpen,
              n = e.handleSetSidebarState,
              i = e.orgProjects,
              c = e.goToSource,
              s = e.activeProjects,
              r = e.completedProjects,
              l = e.tasksMapped,
              d = e.tasksValidated,
              b = e.tasksInvalidated,
              x = e.payableTotal,
              h = e.requestsTotal,
              g = e.paidTotal,
              O = e.activeProjectsCount,
              p = e.inactiveProjectsCount,
              f = e.fetchUserDashStats,
              v = e.fetchUserProjects,
              y = e.update_user_tasks,
              w = Object(a.useContext)(m),
              S = w.refresh,
              _ = w.user,
              k = Object(a.useState)(!1),
              A = Object(o.a)(k, 2),
              C = A[0],
              P = A[1],
              D = Object(a.useState)(0),
              R = Object(o.a)(D, 2),
              T = R[0],
              E = R[1],
              I = Object(a.useState)(10),
              L = Object(o.a)(I, 2),
              B = L[0],
              U = L[1],
              M = Object(a.useState)(null),
              F = Object(o.a)(M, 2),
              Y = F[0],
              N = F[1];
            Object(a.useEffect)(function () {
              _ && S(),
                null === _ && P(!0),
                null !== _ && "user" !== _.role && P(!0),
                v(),
                f(),
                y();
            }, []);
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsxs)("div", {
                  style: { width: "100%", float: "left" },
                  children: [
                    Object(u.jsx)(Zt, {
                      isOpen: t,
                      toggleSidebar: function () {
                        n();
                      },
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        position: "relative",
                        left: "15vw",
                        flexDirection: "column",
                        height: "100vh",
                      },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            marginLeft: "6vh",
                            flexDirection: "row",
                          },
                          children: [
                            Object(u.jsx)("h1", {
                              style: { marginTop: "1vw", paddingBottom: "2vh" },
                              children: "Dashboard:",
                            }),
                            Object(u.jsx)("div", {
                              style: {
                                marginTop: "1vw",
                                position: "relative",
                                left: "37.5vw",
                              },
                            }),
                          ],
                        }),
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            height: "44vh",
                          },
                          children: [
                            Object(u.jsx)(yt, {
                              title: "Projects Overview",
                              subtitle_text_1: "Joined:",
                              subtitle_text_2: "Available:",
                              subtitle_text_3: "Completed:",
                              value_1: O,
                              value_2: p,
                              value_3: r,
                            }),
                            Object(u.jsx)(yt, {
                              title: "Tasks Overview",
                              subtitle_text_1: "Awaiting Approval:",
                              subtitle_text_2: "Approved:",
                              subtitle_text_3: "Invalidated:",
                              value_1: l,
                              value_2: d,
                              value_3: b,
                            }),
                            Object(u.jsx)(yt, {
                              title: "Payment Overview",
                              subtitle_text_1: "Payable Total:",
                              subtitle_text_2: "Payout Requests:",
                              subtitle_text_3: "Payouts to Date:",
                              value_1: "$".concat(x),
                              value_2: "$".concat(h),
                              value_3: "$".concat(g),
                            }),
                          ],
                        }),
                        Object(u.jsx)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            marginLeft: "3.5vw",
                            height: "42vh",
                            width: "77.5vw",
                          },
                          children: Object(u.jsxs)(xt, {
                            style: { boxShadow: "1px 1px 6px 2px gray" },
                            children: [
                              Object(u.jsx)(bt, {}),
                              Object(u.jsxs)(jt.a, {
                                children: [
                                  Object(u.jsx)(Rt, { headLabel: pt }),
                                  Object(u.jsx)(dt.a, {
                                    children:
                                      s &&
                                      s
                                        .slice(T * B, T * B + B)
                                        .map(function (e) {
                                          var t = e.id,
                                            n = e.name,
                                            i = e.difficulty,
                                            a = e.rate_per_task,
                                            s = e.total_tasks,
                                            r = e.tasks_mapped,
                                            o = e.tasks_validated,
                                            l = e.tasks_invalidated,
                                            j = e.url,
                                            d = e.max_payment,
                                            b = e.payment_due;
                                          return Object(u.jsxs)(
                                            Ot,
                                            {
                                              sx: {
                                                "&:hover": {
                                                  backgroundColor:
                                                    "rgba(145, 165, 172, 0.5)",
                                                  cursor: "pointer",
                                                },
                                              },
                                              align: "center",
                                              tabIndex: -1,
                                              onClick: function () {
                                                N(t);
                                              },
                                              selected: Y === t,
                                              onDoubleClick: function () {
                                                return c(j);
                                              },
                                              children: [
                                                Object(u.jsx)(wt, { entry: n }),
                                                Object(u.jsx)(wt, {
                                                  entry: "$".concat(a),
                                                }),
                                                Object(u.jsx)(wt, { entry: s }),
                                                Object(u.jsx)(wt, { entry: i }),
                                                Object(u.jsx)(wt, {
                                                  entry: "$".concat(d),
                                                }),
                                                Object(u.jsx)(wt, {
                                                  entry: "$".concat(b),
                                                }),
                                                Object(u.jsx)(wt, {
                                                  entry: ""
                                                    .concat(o, "/")
                                                    .concat(r),
                                                }),
                                                Object(u.jsx)(wt, { entry: l }),
                                              ],
                                            },
                                            t
                                          );
                                        }),
                                  }),
                                ],
                              }),
                              Object(u.jsx)(ut.a, {
                                style: { width: "100%" },
                                rowsPerPageOptions: [5, 10, 15],
                                component: "div",
                                count: i ? i.length : 5,
                                rowsPerPage: B,
                                page: T,
                                onPageChange: function (e, t) {
                                  return E(t);
                                },
                                onRowsPerPageChange: function (e) {
                                  return (function (e) {
                                    U(e.target.value);
                                  })(e);
                                },
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                C
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        Ui =
          (n(197),
          Object(Xe.a)("div")(function (e) {
            e.theme;
            return {
              display: "flex",
              position: "relative",
              backgroundColor: "#f4753c",
              paddingTop: "1vh",
              "&:before": {
                top: 0,
                width: "100%",
                height: "100%",
                position: "absolute",
                WebkitBackdropFilter: "blur(3px)",
                fontWeight: "400",
              },
            };
          })),
        Mi = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.modalOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.cancel_action }),
                  Object(u.jsx)(kt, { title_text: e.title_text }),
                  Object(u.jsx)(At, {
                    subtitle_text: "Are you sure you want to "
                      .concat(e.confirm_text, " Project # ")
                      .concat(e.projectSelected, "-")
                      .concat(e.projectName, "?"),
                  }),
                  Object(u.jsx)(Fi, {
                    cancel_text: "Cancel",
                    cancel_action: e.cancel_action,
                    confirm_text: e.confirm_text,
                    confirm_action: e.confirm_action,
                  }),
                ],
              }),
            },
            "user"
          );
        },
        Fi = function (e) {
          return Object(u.jsxs)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              textAlign: "center",
              justifyContent: "center",
            },
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.cancel_action,
                cancel_text: e.cancel_text,
              }),
              Object(u.jsx)(_t, {
                confirm_action: e.confirm_action,
                confirm_text: e.confirm_text,
              }),
            ],
          });
        },
        Yi = function (e) {
          return Object(u.jsx)("div", {
            style: { overflowY: "scroll", width: "85vw", height: "83vh" },
            children: Object(u.jsx)(li.a, {
              sx: {
                height: "auto",
                position: "relative",
                top: "3vh",
                left: "3vw",
              },
              container: !0,
              spacing: 3,
              children:
                e.projects &&
                e.projects.slice().map(function (t) {
                  var n = t.id,
                    i = t.name,
                    a = t.difficulty,
                    c = t.visibility,
                    s = t.total_payout,
                    r = t.rate_per_task,
                    o = t.max_editors,
                    l = t.total_editors,
                    j = t.total_tasks,
                    d = t.tasks_mapped,
                    b = t.tasks_validated,
                    x = t.tasks_invalidated,
                    h = t.url,
                    g = t.source,
                    O = t.max_payment;
                  return Object(u.jsx)(Ni, {
                    id: n,
                    name: i,
                    url: h,
                    goToSource: e.goToSource,
                    difficulty: a,
                    visibility: c,
                    max_editors: o,
                    total_editors: l,
                    total_tasks: j,
                    rate_per_task: r,
                    tasks_mapped: d,
                    tasks_validated: b,
                    tasks_invalidated: x,
                    total_payout: s,
                    projectSelected: e.projectSelected,
                    source: g,
                    max_payment: O,
                    handleSetProjectSelected: e.handleSetProjectSelected,
                  });
                }),
            }),
          });
        },
        Ni = function (e) {
          return Object(u.jsxs)(
            nt.a,
            {
              style: {
                boxShadow: "1px 1px 6px 2px gray",
                width: "25vw",
                height: "56vh",
                marginLeft: "2vw",
                marginTop: "2vh",
              },
              onDoubleClick: function () {
                return e.goToSource(e.url);
              },
              children: [
                Object(u.jsx)(Ui, {
                  children: Object(u.jsx)("input", {
                    type: "checkbox",
                    id: e.id,
                    value: e.id,
                    checked: e.id === e.projectSelected,
                    onChange: function (t) {
                      return e.handleSetProjectSelected(e.id, e.name);
                    },
                    style: { marginLeft: "1vw", marginBottom: "1vh" },
                  }),
                }),
                Object(u.jsx)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                    height: "10vh",
                  },
                  children: Object(u.jsx)(kt, { title_text: e.name }),
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsx)(At, {
                      subtitle_text: "Difficulty: ".concat(e.difficulty),
                    }),
                    Object(u.jsx)(At, {
                      subtitle_text: "Visibility: ".concat(
                        !0 === e.visibility ? "Public" : "Private"
                      ),
                    }),
                  ],
                }),
                Object(u.jsx)(At, {
                  subtitle_text: "Source: ".concat(
                    "tasks" === e.source ? "TM4" : "TM3"
                  ),
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Mapped %:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "".concat(
                            (e.total_tasks / 100) * e.tasks_mapped,
                            "%"
                          ),
                        }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Validated %:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "".concat(
                            (e.total_tasks / 100) * e.tasks_validated,
                            "%"
                          ),
                        }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Editors:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: ""
                            .concat(e.total_editors, "/")
                            .concat(e.max_editors),
                        }),
                      ],
                    }),
                  ],
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Tasks Mapped:" }),
                        Object(u.jsx)(At, { subtitle_text: e.tasks_mapped }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, {
                          subtitle_text: "Tasks Validated:",
                        }),
                        Object(u.jsx)(At, { subtitle_text: e.tasks_validated }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Current Payout:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "$".concat(e.total_payout / 100),
                        }),
                      ],
                    }),
                  ],
                }),
                Object(u.jsx)(at.a, {}),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    justifyContent: "center",
                  },
                  children: [
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Total Tasks:" }),
                        Object(u.jsx)(At, { subtitle_text: e.total_tasks }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Rate/Task:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "$".concat(e.rate_per_task),
                        }),
                      ],
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                      },
                      children: [
                        Object(u.jsx)(At, { subtitle_text: "Total Budget:" }),
                        Object(u.jsx)(At, {
                          subtitle_text: "$".concat(e.max_payment),
                        }),
                      ],
                    }),
                  ],
                }),
              ],
            },
            e.id
          );
        },
        qi = function () {
          var e = Object(a.useContext)(ye),
            t = e.sidebarOpen,
            n = e.handleSetSidebarState,
            i = e.fetchUserProjects,
            c = e.activeProjects,
            s = e.inactiveProjects,
            r = e.userJoinProject,
            l = e.userLeaveProject,
            d = e.goToSource,
            b = Object(a.useContext)(m),
            x = b.refresh,
            h = b.user,
            g = C(!1),
            O = Object(o.a)(g, 2),
            p = O[0],
            f = O[1],
            v = Object(a.useState)(null),
            y = Object(o.a)(v, 2),
            w = y[0],
            S = y[1],
            _ = Object(a.useState)(null),
            k = Object(o.a)(_, 2),
            A = k[0],
            P = k[1],
            D = Object(a.useState)(!1),
            R = Object(o.a)(D, 2),
            T = R[0],
            E = R[1],
            I = Object(a.useState)(1),
            L = Object(o.a)(I, 2),
            B = L[0],
            U = L[1];
          Object(a.useEffect)(function () {
            h && x(),
              null === h && E(!0),
              null !== h && "user" !== h.role && E(!0),
              i();
          }, []);
          var M = function (e) {
              U(e.target.value);
            },
            F = function () {
              null !== w && f();
            },
            Y = function (e, t) {
              S(parseInt(e)), P(t);
            };
          return Object(u.jsxs)(u.Fragment, {
            children: [
              Object(u.jsx)(Mi, {
                modalOpen: p,
                handleSetModalOpen: F,
                projectSelected: w,
                projectName: A,
                confirm_text: 1 === B ? "Leave" : "Join",
                cancel_action: F,
                confirm_action:
                  1 === B
                    ? function () {
                        l(w), f();
                      }
                    : function () {
                        r(w), f();
                      },
              }),
              Object(u.jsxs)("div", {
                style: { width: "100%", float: "left" },
                children: [
                  Object(u.jsx)(Zt, {
                    isOpen: t,
                    toggleSidebar: function () {
                      n();
                    },
                  }),
                  Object(u.jsxs)("div", {
                    style: {
                      display: "flex",
                      position: "relative",
                      left: "15vw",
                      flexDirection: "column",
                      height: "100vh",
                    },
                    children: [
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          marginLeft: "6vh",
                          flexDirection: "row",
                        },
                        children: [
                          Object(u.jsx)("h1", {
                            style: { marginTop: "1vw", paddingBottom: "2vh" },
                            children: "Projects:",
                          }),
                          Object(u.jsx)("div", {
                            style: {
                              marginTop: "1vw",
                              position: "relative",
                              left: "60vw",
                            },
                            children: Object(u.jsx)(Dt, {
                              button1: !0,
                              button2: !1,
                              button3: !1,
                              button1_text: 1 === B ? "Leave" : "Join",
                              button2_text: "Edit",
                              button3_text: "Delete",
                              button1_action: F,
                            }),
                          }),
                        ],
                      }),
                      Object(u.jsxs)(oi.d, {
                        children: [
                          Object(u.jsxs)(oi.b, {
                            style: {
                              marginLeft: "3vw",
                              marginTop: "0vh",
                              paddingTop: "0vh",
                            },
                            children: [
                              Object(u.jsx)(oi.a, {
                                value: 1,
                                onClick: function (e) {
                                  return M(e);
                                },
                                children: "Joined",
                              }),
                              Object(u.jsx)(oi.a, {
                                value: 2,
                                onClick: function (e) {
                                  return M(e);
                                },
                                children: "Available",
                              }),
                            ],
                          }),
                          Object(u.jsx)(oi.c, {
                            children: Object(u.jsx)(
                              Yi,
                              {
                                goToSource: d,
                                projects: c,
                                handleSetProjectSelected: Y,
                                projectSelected: w,
                              },
                              1
                            ),
                          }),
                          Object(u.jsx)(oi.c, {
                            children: Object(u.jsx)(
                              Yi,
                              {
                                goToSource: d,
                                projects: s,
                                handleSetProjectSelected: Y,
                                projectSelected: w,
                              },
                              2
                            ),
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
              T
                ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                : Object(u.jsx)(u.Fragment, {}),
            ],
          });
        },
        zi =
          (n(198),
          function () {
            var e = Object(a.useContext)(ye),
              t = e.firstName,
              n = e.lastName,
              i = e.OSMname,
              c = e.city,
              s = e.country,
              r = e.email,
              l = e.payEmail,
              d = e.sidebarOpen,
              b = e.fetchUserDetails,
              x = e.updateUserDetails,
              h = e.handleUserDetailsStates,
              g = e.handleSetSidebarState,
              O = Object(a.useContext)(m),
              p = O.refresh,
              f = O.user,
              v = Object(a.useState)(!1),
              y = Object(o.a)(v, 2),
              w = y[0],
              S = y[1],
              _ = C(!1),
              k = Object(o.a)(_, 2),
              A = k[0],
              P = k[1];
            Object(a.useEffect)(function () {
              f && p(),
                null === f && S(!0),
                null !== f && "user" !== f.role && S(!0),
                b();
            }, []);
            var D = function () {
              P();
            };
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsx)(Et, {
                  modal_open: A,
                  handleOpenCloseModal: D,
                  interrogative:
                    "Are you sure you want to update these details?",
                  button_1_text: "Confirm",
                  button_1_action: function () {
                    x(), D();
                  },
                  button_2_text: "Cancel",
                  button_2_action: D,
                }),
                Object(u.jsxs)("div", {
                  style: { width: "100%", float: "left" },
                  children: [
                    Object(u.jsx)(Zt, {
                      isOpen: d,
                      toggleSidebar: function () {
                        g();
                      },
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        position: "relative",
                        left: "15vw",
                        flexDirection: "column",
                        height: "100vh",
                      },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            marginLeft: "5vh",
                            flexDirection: "row",
                          },
                          children: [
                            Object(u.jsx)("h1", {
                              style: {
                                marginLeft: ".5vw",
                                marginTop: "1vw",
                                paddingBottom: "2vh",
                              },
                              children: "Account:",
                            }),
                            Object(u.jsx)("div", {
                              style: {
                                marginTop: "1vw",
                                position: "relative",
                                top: "2vh",
                                left: "61.5vw",
                              },
                              children: Object(u.jsx)(Pt, {
                                button_text: "submit",
                                button_action: function () {
                                  D();
                                },
                              }),
                            }),
                          ],
                        }),
                        Object(u.jsx)("div", {
                          style: {
                            display: "flex",
                            flexDirection: "row",
                            marginLeft: "3vw",
                            marginTop: "1vw",
                            height: "82%",
                            width: "79vw",
                          },
                          children: Object(u.jsxs)(xt, {
                            style: { boxShadow: "1px 1px 6px 2px gray" },
                            children: [
                              Object(u.jsx)(bt, {}),
                              Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "row",
                                  height: "15vh",
                                  marginTop: "2vh",
                                  marginBottom: "2vh",
                                },
                                children: [
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "First Name:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: t,
                                        onChange: function (e) {
                                          return h("first_name", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "2vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Last Name:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: n,
                                        onChange: function (e) {
                                          return h("last_name", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "2vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "OSM Username:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: i,
                                        onChange: function (e) {
                                          return h("osm_name", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "2vw",
                                        },
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              Object(u.jsx)(at.a, {}),
                              Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "row",
                                  height: "15vh",
                                  marginTop: "2vh",
                                  marginBottom: "2vh",
                                },
                                children: [
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      marginLeft: "15vw",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "City:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: c,
                                        onChange: function (e) {
                                          return h("city", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Country:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: s,
                                        onChange: function (e) {
                                          return h("country", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                              Object(u.jsx)(at.a, {}),
                              Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "row",
                                  height: "15vh",
                                  marginTop: "2vh",
                                  marginBottom: "2vh",
                                },
                                children: [
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      marginLeft: "7vw",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Personal Email:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: r,
                                        onChange: function (e) {
                                          return h("email", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                  Object(u.jsxs)("div", {
                                    style: {
                                      display: "flex",
                                      flexDirection: "row",
                                      alignItems: "center",
                                    },
                                    children: [
                                      Object(u.jsx)(kt, {
                                        title_text: "Payment Email:",
                                      }),
                                      Object(u.jsx)("input", {
                                        type: "text",
                                        value: l,
                                        onChange: function (e) {
                                          return h("pay_email", e);
                                        },
                                        style: {
                                          height: "5vh",
                                          marginRight: "5vw",
                                        },
                                      }),
                                    ],
                                  }),
                                ],
                              }),
                            ],
                          }),
                        }),
                      ],
                    }),
                  ],
                }),
                w
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        Ki = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.detailsOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleDetailsOpen }),
                  Object(u.jsx)(kt, { title_text: e.title_text }),
                  Object(u.jsxs)("div", {
                    style: { display: "flex", flexDirection: "column" },
                    children: [
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "User:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.user_name,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                          Object(u.jsx)(kt, { title_text: "Payment Amount:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: "$".concat(e.amount_paid),
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Date Paid:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.date_paid,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                          Object(u.jsx)(kt, { title_text: "Payoneer ID:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.payoneer_id,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "35%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Payment Email:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.payment_email,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Task IDs:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.task_ids,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                          marginBottom: "2vh",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Notes:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.notes,
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                ],
              }),
            },
            "delete"
          );
        },
        Vi = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.requestOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleRequestOpen }),
                  Object(u.jsx)(kt, { title_text: e.title_text }),
                  Object(u.jsxs)("div", {
                    style: { display: "flex", flexDirection: "column" },
                    children: [
                      Object(u.jsx)(at.a, {}),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Request Amount:" }),
                          Object(u.jsx)("input", {
                            type: "number",
                            value: e.requestAmount,
                            style: {
                              height: "5vh",
                              marginRight: "0vw",
                              width: "67.5%",
                            },
                          }),
                        ],
                      }),
                      Object(u.jsxs)("div", {
                        style: {
                          display: "flex",
                          flexDirection: "row",
                          alignItems: "center",
                          marginLeft: "1vw",
                          width: "100%",
                        },
                        children: [
                          Object(u.jsx)(kt, { title_text: "Notes:" }),
                          Object(u.jsx)("input", {
                            type: "text",
                            value: e.notes,
                            onChange: function (t) {
                              return e.handleSetNotes(t);
                            },
                            style: {
                              height: "5vh",
                              marginRight: "3vw",
                              width: "95%",
                            },
                          }),
                        ],
                      }),
                    ],
                  }),
                  Object(u.jsx)(Hi, {
                    confirm_text: "Submit",
                    cancel_text: "Cancel",
                    cancel_action: e.handleRequestOpen,
                    confirm_action: e.confirm_action,
                  }),
                ],
              }),
            },
            "request"
          );
        },
        Hi = function (e) {
          return Object(u.jsxs)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              textAlign: "center",
              justifyContent: "center",
            },
            children: [
              Object(u.jsx)(St, {
                cancel_action: e.cancel_action,
                cancel_text: "Cancel",
              }),
              Object(u.jsx)(_t, {
                confirm_action: e.confirm_action,
                confirm_text: e.confirm_text,
              }),
            ],
          });
        },
        Wi =
          (n(199),
          function () {
            var e = Object(a.useContext)(ye),
              t = e.sidebarOpen,
              n = e.handleSetSidebarState,
              i = e.orgPayments,
              c = e.orgRequests,
              s = e.CSVdata,
              r = e.submitPayRequest,
              l = e.fetchUserPayable,
              d = e.fetchUserTransactions,
              b = Object(a.useContext)(m),
              x = b.refresh,
              h = b.user,
              g = Object(a.useState)(!1),
              O = Object(o.a)(g, 2),
              p = O[0],
              f = O[1],
              v = Object(a.useState)(0),
              y = Object(o.a)(v, 2),
              w = y[0],
              S = y[1],
              _ = Object(a.useState)(10),
              k = Object(o.a)(_, 2),
              A = k[0],
              P = k[1],
              D = C(!1),
              R = Object(o.a)(D, 2),
              T = R[0],
              E = R[1],
              I = C(!1),
              L = Object(o.a)(I, 2),
              B = L[0],
              U = L[1],
              M = Object(a.useState)(null),
              F = Object(o.a)(M, 2),
              Y = F[0],
              N = F[1],
              q = Object(a.useState)(null),
              z = Object(o.a)(q, 2),
              K = (z[0], z[1]),
              V = Object(a.useState)(null),
              H = Object(o.a)(V, 2),
              W = H[0],
              Q = H[1],
              G = Object(a.useState)(null),
              J = Object(o.a)(G, 2),
              X = J[0],
              Z = J[1],
              $ = Object(a.useState)([]),
              ee = Object(o.a)($, 2),
              te = ee[0],
              ne = ee[1],
              ie = Object(a.useState)(null),
              ae = Object(o.a)(ie, 2),
              ce = ae[0],
              se = ae[1],
              re = Object(a.useState)(null),
              oe = Object(o.a)(re, 2),
              le = oe[0],
              je = oe[1],
              de = Object(a.useState)(null),
              ue = Object(o.a)(de, 2),
              be = ue[0],
              xe = ue[1],
              he = Object(a.useState)(null),
              ge = Object(o.a)(he, 2),
              Oe = ge[0],
              pe = ge[1],
              fe = Object(a.useState)(null),
              me = Object(o.a)(fe, 2),
              ve = me[0],
              we = me[1],
              Se = Object(a.useState)(1),
              _e = Object(o.a)(Se, 2),
              ke = _e[0],
              Ae = _e[1];
            Object(a.useEffect)(function () {
              h && x(),
                null === h && f(!0),
                null !== h && "user" !== h.role && f(!0),
                l(Te),
                d();
            }, []),
              Object(a.useEffect)(
                function () {
                  Q(null), je(null), N(null), ne(null);
                },
                [ke]
              );
            var Ce = function (e) {
                P(e.target.value);
              },
              Pe = function () {
                E(!T);
              },
              De = function () {
                null !== Oe && U();
              },
              Re = function (e) {
                Ae(e.target.value);
              },
              Te = function (e) {
                je(e);
              };
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsx)(Vi, {
                  requestOpen: T,
                  handleRequestOpen: Pe,
                  title_text: "Payment Request",
                  notes: ce,
                  handleSetNotes: function (e) {
                    se(e.target.value);
                  },
                  requestAmount: le,
                  confirm_action: function () {
                    r(ce), Pe();
                  },
                }),
                Object(u.jsx)(Ki, {
                  detailsOpen: B,
                  handleDetailsOpen: De,
                  title_text: "Details for Payment ".concat(X),
                  payoneer_id: X,
                  user_name: Y,
                  date_paid: ve,
                  payment_email: W,
                  amount_paid: le,
                  task_ids: te,
                  notes: ce,
                }),
                Object(u.jsxs)("div", {
                  style: { width: "100%", float: "left" },
                  children: [
                    Object(u.jsx)(Zt, {
                      isOpen: t,
                      toggleSidebar: function () {
                        n();
                      },
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        position: "relative",
                        left: "15vw",
                        flexDirection: "column",
                        height: "100vh",
                      },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            marginLeft: "6vh",
                            flexDirection: "row",
                          },
                          children: [
                            Object(u.jsx)("h1", {
                              style: { marginTop: "1vw", paddingBottom: "2vh" },
                              children: "Payments:",
                            }),
                            Object(u.jsx)("div", {
                              style:
                                1 === ke
                                  ? {
                                      marginTop: "1vw",
                                      position: "relative",
                                      left: "58svw",
                                    }
                                  : {
                                      marginTop: "1vw",
                                      position: "relative",
                                      left: "48.5vw",
                                    },
                              children: Object(u.jsx)(Dt, {
                                data: s,
                                csv: 1 !== ke,
                                button2: !0,
                                button1_text: "CSV Report",
                                button2_text:
                                  1 === ke ? "Request Pay" : "View Details",
                                button_2_width: "25%",
                                button2_action: 1 === ke ? Pe : De,
                              }),
                            }),
                          ],
                        }),
                        Object(u.jsxs)(oi.d, {
                          children: [
                            Object(u.jsxs)(oi.b, {
                              style: {
                                marginLeft: "3vw",
                                marginTop: "0vh",
                                paddingTop: "0vh",
                              },
                              children: [
                                Object(u.jsx)(oi.a, {
                                  value: 1,
                                  onClick: function (e) {
                                    return Re(e);
                                  },
                                  children: "Pay Requests",
                                }),
                                Object(u.jsx)(oi.a, {
                                  value: 2,
                                  onClick: function (e) {
                                    return Re(e);
                                  },
                                  children: "Completed Payouts",
                                }),
                              ],
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)(It, {
                                rowsPerPage: A,
                                page: w,
                                setPage: S,
                                handleChangeRowsPerPage: Ce,
                                orgRequests: c,
                                requestSelected: be,
                                handleSetRequestSelected: function (
                                  e,
                                  t,
                                  n,
                                  i,
                                  a,
                                  c,
                                  s
                                ) {
                                  K(n), xe(e), N(t), je(i), we(a), Q(c), ne(s);
                                },
                              }),
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)(Lt, {
                                rowsPerPage: A,
                                page: w,
                                setPage: S,
                                handleChangeRowsPerPage: Ce,
                                orgPayments: i,
                                paymentSelected: Oe,
                                handleSetPaymentSelected: function (
                                  e,
                                  t,
                                  n,
                                  i,
                                  a,
                                  c,
                                  s,
                                  r
                                ) {
                                  pe(e),
                                    K(n),
                                    xe(e),
                                    N(t),
                                    je(i),
                                    we(a),
                                    Q(c),
                                    ne(s),
                                    Z(r);
                                },
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                p
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        Qi = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.modalOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleModalOpen }),
                  1 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Step 1: OSM Username",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Mikro needs your OSM username to track your task completion.",
                          }),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              'Please enter your username below and press "ok" to proceed',
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              marginTop: "1vh",
                              marginBottom: "2vh",
                            },
                            children: [
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.OSMusername,
                                placeholder: "OSM username",
                                onChange: function (t) {
                                  return e.handleSetOSMusername(t);
                                },
                                style: {
                                  height: "5vh",
                                  width: "80%",
                                  marginRight: "1.25vw",
                                  marginBottom: "2vh",
                                },
                              }),
                              Object(u.jsx)(Pt, {
                                button_text: "ok",
                                button_action: function () {
                                  return e.handleSetModalPage(2);
                                },
                              }),
                            ],
                          }),
                        ],
                      })
                    : 2 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Step 2: Payment Email",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Mikro needs your Payoneer email address in order to make payments.",
                          }),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              'Please enter your Payoneer email below and press "ok" to proceed',
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              marginTop: "1vh",
                              marginBottom: "2vh",
                            },
                            children: [
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.payoneerEmail,
                                placeholder: "Payoneer Email",
                                onChange: function (t) {
                                  return e.handleSetPayoneerEmail(t);
                                },
                                style: {
                                  height: "5vh",
                                  width: "80%",
                                  marginRight: "1.25vw",
                                  marginBottom: "2vh",
                                },
                              }),
                              Object(u.jsx)(Pt, {
                                button_text: "ok",
                                button_action: function () {
                                  return e.handleSetModalPage(3);
                                },
                              }),
                            ],
                          }),
                        ],
                      })
                    : 3 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(kt, { title_text: "Step 3: Location" }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Mikro needs to know your area of residence to be in compliance with payment regulations.",
                          }),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              'Please enter your Country and City of residence below and press "ok" to proceed',
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              marginTop: "1vh",
                              marginBottom: "2vh",
                            },
                            children: [
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.country && e.country ? e.country : "",
                                placeholder: "Country",
                                onChange: function (t) {
                                  return e.handleSetCountry(t);
                                },
                                style: {
                                  height: "5vh",
                                  width: "80%",
                                  marginRight: "1.25vw",
                                  marginBottom: "2vh",
                                },
                              }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.city && e.city ? e.city : "",
                                placeholder: "City",
                                onChange: function (t) {
                                  return e.handleSetCity(t);
                                },
                                style: {
                                  height: "5vh",
                                  width: "80%",
                                  marginRight: "1.25vw",
                                  marginBottom: "2vh",
                                },
                              }),
                              Object(u.jsx)(Pt, {
                                button_text: "ok",
                                button_action: function () {
                                  return e.handleSetModalPage(4);
                                },
                              }),
                            ],
                          }),
                        ],
                      })
                    : 4 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Step 4: Terms of Service",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Mikro has a few terms and conditions which need your approval.",
                          }),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              'Please read the terms and conditions. If you agree, press "ok" to proceed',
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              width: "100%",
                              height: "30vh",
                              backgroundColor: "white",
                            },
                            children: [
                              Object(u.jsxs)("div", {
                                style: {
                                  width: "90%",
                                  height: "25vh",
                                  backgroundColor: "AliceBlue",
                                  overflowY: "scroll",
                                },
                                children: [
                                  "What is Lorem Ipsum?",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum. Why do we use it? It is a long established fact that a reader will be distracted by the readable content of a page when looking at its layout. The point of using Lorem Ipsum is that it has a more-or-less normal distribution of letters, as opposed to using 'Content here, content here', making it look like readable English.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Many desktop publishing packages and web page editors now use Lorem Ipsum as their default model text, and a search for 'lorem ipsum' will uncover many web sites still in their infancy.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Various versions have evolved over the years, sometimes by accident, sometimes on purpose (injected humour and the like).",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Where does it come from?",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Contrary to popular belief, Lorem Ipsum is not simply random text.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "It has roots in a piece of classical Latin literature from 45 BC, making it over 2000 years old.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Richard McClintock, a Latin professor at Hampden-Sydney College in Virginia, looked up one of the more obscure Latin words, consectetur, from a Lorem Ipsum passage, and going through the cites of the word in classical literature, discovered the undoubtable source.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  'Lorem Ipsum comes from sections 1.10.32 and 1.10.33 of "de Finibus Bonorum et Malorum" (The Extremes of Good and Evil) by Cicero, written in 45 BC.',
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "This book is a treatise on the theory of ethics, very popular during the Renaissance.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  'The first line of Lorem Ipsum, "Lorem ipsum dolor sit amet..", comes from a line in section 1.10.32.',
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "The standard chunk of Lorem Ipsum used since the 1500s is reproduced below for those interested.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  'Sections 1.10.32 and 1.10.33 from "de Finibus Bonorum et Malorum" by Cicero are also reproduced in their exact original form, accompanied by English versions from the 1914 translation by H. Rackham.',
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "Where can I get some?",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "There are many variations of passages of Lorem Ipsum available, but the majority have suffered alteration in some form, by injected humour, or randomised words which don't look even slightly believable.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "If you are going to use a passage of Lorem Ipsum, you need to be sure there isn't anything embarrassing hidden in the middle of text.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "All the Lorem Ipsum generators on the Internet tend to repeat predefined chunks as necessary, making this the first true generator on the Internet.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "It uses a dictionary of over 200 Latin words, combined with a handful of model sentence structures, to generate Lorem Ipsum which looks reasonable.",
                                  Object(u.jsx)("br", {}),
                                  Object(u.jsx)("br", {}),
                                  "The generated Lorem Ipsum is therefore always free from repetition, injected humour, or non-characteristic words etc.",
                                ],
                              }),
                              Object(u.jsxs)("div", {
                                style: {
                                  display: "flex",
                                  flexDirection: "row",
                                  marginTop: "1vh",
                                },
                                children: [
                                  Object(u.jsx)(At, {
                                    subtitle_text:
                                      "I agree to the terms and conditions",
                                  }),
                                  Object(u.jsx)("input", {
                                    type: "checkbox",
                                    value: "public",
                                    name: "public",
                                    onChange: function () {
                                      return e.handleSetTermsAgreement();
                                    },
                                    checked: !0 === e.termsAgreement,
                                  }),
                                ],
                              }),
                            ],
                          }),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "row",
                              justifyContent: "center",
                              marginTop: "1vh",
                              marginBottom: "2vh",
                            },
                            children: [
                              Object(u.jsx)(Pt, {
                                button_text: "cancel",
                                button_action: function () {
                                  return e.handleModalOpen();
                                },
                              }),
                              Object(u.jsx)(Pt, {
                                button_text: "ok",
                                button_action: function () {
                                  return e.handleSetModalPage(5);
                                },
                              }),
                            ],
                          }),
                        ],
                      })
                    : Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(kt, {
                            title_text: "Step 4: Start Mapping!",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Registration with Mikro is complete.",
                          }),
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Press the button below to proceed to your user dashboard and start making money!",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              marginTop: "1vh",
                              marginBottom: "2vh",
                            },
                            children: Object(u.jsx)(Pt, {
                              button_text: "ok",
                              button_action: function () {
                                return e.handleSetModalPage(0);
                              },
                            }),
                          }),
                        ],
                      }),
                ],
              }),
            },
            "firstLogin"
          );
        },
        Gi =
          (Pe.b.div(
            Bn ||
              (Bn = Object(Ce.a)([
                "\n  width: 100vw;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  transition: all 0.4s ease;\n\n  ",
                "\n",
              ])),
            function (e) {
              return e.modalShown
                ? "filter: blur(10px) grayscale(50%);\n  -webkit-filter: blur(10px) grayscale(50%);\n  -webkit-transform: scale(0.9);\n  pointer-events: none;"
                : "";
            }
          ),
          Pe.b.form(
            Un ||
              (Un = Object(Ce.a)([
                "\n  font-size: 16px;\n  line-height: 2;\n  max-width: 450px;\n  width: 100%;\n  text-align: center;\n",
              ]))
          ),
          Pe.b.img(
            Mn ||
              (Mn = Object(Ce.a)([
                "\n  height: 35vh;\n  margin-left: auto;\n  margin-right: auto;\n  display: block;\n",
              ]))
          )),
        Ji =
          (Pe.b.h1(
            Fn ||
              (Fn = Object(Ce.a)([
                "\n  text-align: center;\n  font-size: 56px;\n",
              ]))
          ),
          Pe.b.input(
            Yn ||
              (Yn = Object(Ce.a)([
                "\n  width: 80%;\n  padding: 12px 20px;\n  margin: 8px 0;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  box-sizing: border-box;\n",
              ]))
          ),
          Pe.b.button(
            Nn ||
              (Nn = Object(Ce.a)([
                "\n  margin: 15px 0px;\n  margin-right: 10px;\n  width: 25%;\n  background-color: #f4753c;\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  &:hover {\n    background-color: #c85823;\n  }\n",
              ]))
          ),
          function () {
            var e = Object(a.useState)(!1),
              t = Object(o.a)(e, 2),
              n = t[0],
              i = t[1],
              c = C(!1),
              s = Object(o.a)(c, 2),
              r = s[0],
              l = s[1],
              d = Object(a.useState)(1),
              b = Object(o.a)(d, 2),
              x = b[0],
              h = b[1],
              g = Object(a.useState)(null),
              O = Object(o.a)(g, 2),
              p = O[0],
              f = O[1],
              m = Object(a.useState)(null),
              v = Object(o.a)(m, 2),
              y = v[0],
              w = v[1],
              S = C(!1),
              _ = Object(o.a)(S, 2),
              k = _[0],
              A = _[1],
              P = Object(a.useState)(null),
              D = Object(o.a)(P, 2),
              R = D[0],
              T = D[1],
              E = Object(a.useState)(null),
              I = Object(o.a)(E, 2),
              L = I[0],
              B = I[1],
              U = Object(a.useContext)(ye),
              M = U.firstLoginUpdate,
              F = U.isValidEmail,
              Y = function () {
                l(), h(1), f(""), w(""), B(null), T(null);
              };
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsx)(Qi, {
                  modalOpen: r,
                  handleModalOpen: Y,
                  OSMusername: p,
                  handleSetOSMusername: function (e) {
                    f(e.target.value);
                  },
                  modalPage: x,
                  handleSetModalPage: function (e) {
                    2 === e &&
                      (p
                        ? h(e)
                        : alert("You Must Enter Your OSM Username to Proceed")),
                      3 === e &&
                        (y && F(y)
                          ? h(e)
                          : alert(
                              "You Must Enter Your Payoneer Email address to Proceed"
                            )),
                      4 === e &&
                        (L && R
                          ? h(e)
                          : alert(
                              "You enter your Country and City of residence to Proceed"
                            )),
                      5 === e &&
                        (!1 !== k
                          ? h(e)
                          : alert(
                              "You must check the box indicating you agree to the Mikro terms of service to Proceed"
                            )),
                      0 === e && (M(p, y, R, L, k), i(!0));
                  },
                  payoneerEmail: y,
                  handleSetPayoneerEmail: function (e) {
                    w(e.target.value);
                  },
                  termsAgreement: k,
                  handleSetTermsAgreement: function () {
                    A();
                  },
                  city: L,
                  country: R,
                  handleSetCity: function (e) {
                    B(e.target.value);
                  },
                  handleSetCountry: function (e) {
                    console.log(e), T(e.target.value);
                  },
                }),
                Object(u.jsxs)("div", {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  },
                  children: [
                    Object(u.jsx)(Gi, {
                      style: { marginTop: "10vh" },
                      src: Ge,
                      alt: "Kaart Logo",
                    }),
                    Object(u.jsx)(st.a, {
                      component: "span",
                      variant: "h1",
                      sx: { color: "#000000" },
                      children: "Welcome to Mikro!",
                    }),
                    Object(u.jsx)(kt, {
                      title_text:
                        "There are a few more steps to get you ready to use Mikro",
                    }),
                    Object(u.jsx)(kt, {
                      title_text: "Press the button below to begin",
                    }),
                    Object(u.jsx)("div", {
                      style: { marginTop: "2vh" },
                      children: Object(u.jsx)(Pt, {
                        button_text: "Start",
                        button_action: function () {
                          return Y();
                        },
                      }),
                    }),
                  ],
                }),
                n
                  ? Object(u.jsx)(j.a, { push: !0, to: "/dashboard" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        Xi = [
          { id: "name", label: "Title", alignRight: !1 },
          { id: "Difficulty", label: "Difficulty", alignRight: !1 },
          { id: "Point Value", label: "Point Value", alignRight: !1 },
          { id: "Link", label: "Link", alignRight: !1 },
        ],
        Zi = function (e) {
          return Object(u.jsx)(
            lt.a,
            {
              open: e.addOpen,
              children: Object(u.jsxs)(ht, {
                children: [
                  Object(u.jsx)(Ct, { close_action: e.handleAddOpen }),
                  Object(u.jsx)(kt, { title_text: "Add New Training Lesson" }),
                  1 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Enter the URL link to the video or training document, the difficulty level and the point value for this lesson",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)("div", {
                            style: { display: "flex", flexDirection: "column" },
                            children: Object(u.jsxs)("div", {
                              style: {
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                marginLeft: "1vw",
                                width: "100%",
                              },
                              children: [
                                Object(u.jsx)(kt, { title_text: "URL:" }),
                                Object(u.jsx)("input", {
                                  type: "text",
                                  value: e.URL,
                                  onChange: function (t) {
                                    return e.handleSetURL(t);
                                  },
                                  style: {
                                    height: "5vh",
                                    marginRight: "3vw",
                                    width: "95%",
                                  },
                                }),
                              ],
                            }),
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsx)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              marginBottom: "1vh",
                            },
                            children: Object(u.jsxs)("div", {
                              style: {
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                marginLeft: "1vw",
                                width: "100%",
                              },
                              children: [
                                Object(u.jsx)(kt, {
                                  title_text: "Point Value:",
                                }),
                                Object(u.jsx)("input", {
                                  type: "number",
                                  min: "1",
                                  step: "1",
                                  value: e.pointValue,
                                  onChange: function (t) {
                                    return e.handleSetPointValue(t);
                                  },
                                  style: {
                                    height: "5vh",
                                    marginRight: "3vw",
                                    width: "10vw",
                                  },
                                }),
                                Object(u.jsx)(kt, {
                                  title_text: "Difficulty:",
                                }),
                                Object(u.jsxs)("select", {
                                  style: { marginRight: "1vw" },
                                  onChange: e.handleSetDifficulty,
                                  children: [
                                    Object(u.jsx)("option", {
                                      value: "Easy",
                                      onChange: function (t) {
                                        return e.handleSetDifficulty(t);
                                      },
                                      children: "Easy",
                                    }),
                                    Object(u.jsx)("option", {
                                      value: "Intermediate",
                                      onChange: function (t) {
                                        return e.handleSetDifficulty(t);
                                      },
                                      children: "Intermediate",
                                    }),
                                    Object(u.jsx)("option", {
                                      value: "Hard",
                                      onChange: function (t) {
                                        return e.handleSetDifficulty(t);
                                      },
                                      children: "Hard",
                                    }),
                                  ],
                                }),
                              ],
                            }),
                          }),
                        ],
                      })
                    : 2 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Enter question 1, the correct answer, and three incorrect answers.",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              marginBottom: "1vh",
                              alignItems: "center",
                            },
                            children: [
                              Object(u.jsx)(kt, { title_text: "Question 1:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.question1,
                                onChange: function (t) {
                                  return e.handleSetQuestion(1, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, {
                                title_text: "Correct Answer:",
                              }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.answer1,
                                onChange: function (t) {
                                  return e.handleSetAnswer(1, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 1:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect1_1,
                                onChange: function (t) {
                                  return e.handleSetIncorrect(1, 1, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 2:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect1_2,
                                onChange: function (t) {
                                  return e.handleSetIncorrect(1, 2, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 3:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect1_3,
                                onChange: function (t) {
                                  return e.handleSetIncorrect(1, 3, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                            ],
                          }),
                        ],
                      })
                    : 3 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Enter question 2, the correct answer, and three incorrect answers.",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              marginBottom: "1vh",
                              alignItems: "center",
                            },
                            children: [
                              Object(u.jsx)(kt, { title_text: "Question 2:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.question2 ? e.question2 : "",
                                onChange: function (t) {
                                  return e.handleSetQuestion(2, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, {
                                title_text: "Correct Answer:",
                              }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.answer2 ? e.answer2 : "",
                                onChange: function (t) {
                                  return e.handleSetAnswer(2, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 1:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect2_1 ? e.incorrect2_1 : "",
                                onChange: function (t) {
                                  return e.handleSetIncorrect(2, 1, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 2:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect2_2 ? e.incorrect2_2 : "",
                                onChange: function (t) {
                                  return e.handleSetIncorrect(2, 2, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 3:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect2_3 ? e.incorrect2_3 : "",
                                onChange: function (t) {
                                  return e.handleSetIncorrect(2, 3, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                            ],
                          }),
                        ],
                      })
                    : 4 === e.modalPage
                    ? Object(u.jsxs)(u.Fragment, {
                        children: [
                          Object(u.jsx)(At, {
                            subtitle_text:
                              "Enter question 3, the correct answer, and three incorrect answers.",
                          }),
                          Object(u.jsx)(at.a, {}),
                          Object(u.jsxs)("div", {
                            style: {
                              display: "flex",
                              flexDirection: "column",
                              marginBottom: "1vh",
                              alignItems: "center",
                            },
                            children: [
                              Object(u.jsx)(kt, { title_text: "Question 3:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.question3 ? e.question3 : "",
                                onChange: function (t) {
                                  return e.handleSetQuestion(3, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, {
                                title_text: "Correct Answer:",
                              }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.answer3 ? e.answer3 : "",
                                onChange: function (t) {
                                  return e.handleSetAnswer(3, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 1:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect3_1 ? e.incorrect3_1 : "",
                                onChange: function (t) {
                                  return e.handleSetIncorrect(3, 1, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 2:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect3_2 ? e.incorrect3_2 : "",
                                onChange: function (t) {
                                  return e.handleSetIncorrect(3, 2, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                              Object(u.jsx)(kt, { title_text: "Incorrect 3:" }),
                              Object(u.jsx)("input", {
                                type: "text",
                                value: e.incorrect3_3 ? e.incorrect3_3 : "",
                                onChange: function (t) {
                                  return e.handleSetIncorrect(3, 3, t);
                                },
                                style: { height: "5vh", width: "95%" },
                              }),
                            ],
                          }),
                        ],
                      })
                    : Object(u.jsx)(u.Fragment, {}),
                  Object(u.jsx)("div", {
                    style: { marginBottom: "1vh" },
                    children: Object(u.jsx)(Tt, {
                      confirm_text: "Next",
                      confirm_action: function () {
                        return e.handleSetModalPage();
                      },
                      cancel_text: "Cancel",
                      cancel_action: e.handleAddOpen,
                    }),
                  }),
                ],
              }),
            },
            "add"
          );
        },
        $i = function (e) {
          return Object(u.jsx)("div", {
            style: {
              display: "flex",
              flexDirection: "row",
              marginLeft: "3.5vw",
              height: "78vh",
              width: "77.5vw",
            },
            children: Object(u.jsxs)(xt, {
              style: { boxShadow: "1px 1px 6px 2px gray" },
              children: [
                Object(u.jsx)(bt, {}),
                Object(u.jsxs)(jt.a, {
                  children: [
                    Object(u.jsx)(Rt, { headLabel: Xi }),
                    Object(u.jsx)(dt.a, {
                      children:
                        e.orgPayments &&
                        e.orgPayments
                          .slice(
                            e.page * e.rowsPerPage,
                            e.page * e.rowsPerPage + e.rowsPerPage
                          )
                          .map(function (t) {
                            var n = t.id,
                              i = t.payment_email,
                              a = t.user,
                              c = t.user_id,
                              s = t.amount_paid,
                              r = t.task_ids,
                              o = t.date_paid,
                              l = t.payoneer_id;
                            return Object(u.jsxs)(
                              Ot,
                              {
                                sx: {
                                  "&:hover": {
                                    backgroundColor: "rgba(145, 165, 172, 0.5)",
                                    cursor: "pointer",
                                  },
                                },
                                align: "center",
                                tabIndex: -1,
                                onClick: function () {
                                  return e.handleSetPaymentSelected(
                                    n,
                                    a,
                                    c,
                                    s,
                                    o,
                                    i,
                                    r,
                                    l
                                  );
                                },
                                selected: e.paymentSelected === n,
                                children: [
                                  Object(u.jsx)(wt, { entry: a }),
                                  Object(u.jsx)(wt, { entry: n }),
                                  Object(u.jsx)(wt, { entry: "$".concat(s) }),
                                  Object(u.jsx)(wt, { entry: o }),
                                ],
                              },
                              t
                            );
                          }),
                    }),
                  ],
                }),
                Object(u.jsx)(ut.a, {
                  style: { width: "auto" },
                  rowsPerPageOptions: [5, 10, 15],
                  component: "div",
                  count: e.pay_requests ? e.pay_requests.length : 5,
                  rowsPerPage: e.rowsPerPage,
                  page: e.page,
                  onPageChange: function (t, n) {
                    return e.setPage(n);
                  },
                  onRowsPerPageChange: function (t) {
                    return e.handleChangeRowsPerPage(t);
                  },
                }),
              ],
            }),
          });
        },
        ea =
          (n(200),
          function () {
            var e = Object(a.useContext)(ye),
              t = e.sidebarOpen,
              n = e.handleSetSidebarState,
              i =
                (e.orgPayments,
                e.orgRequests,
                e.CSVdata,
                e.submitPayRequest,
                e.fetchUserPayable),
              c = e.fetchUserTransactions,
              s = Object(a.useContext)(m),
              r = s.refresh,
              l = s.user,
              d = Object(a.useState)(!1),
              b = Object(o.a)(d, 2),
              x = b[0],
              h = b[1],
              g = Object(a.useState)(0),
              O = Object(o.a)(g, 2),
              p = O[0],
              f = O[1],
              v = Object(a.useState)(10),
              y = Object(o.a)(v, 2),
              w = y[0],
              S = y[1],
              _ = C(!1),
              k = Object(o.a)(_, 2),
              A = (k[0], k[1], C(!1)),
              P = Object(o.a)(A, 2),
              D = (P[0], P[1], Object(a.useState)(null)),
              R = Object(o.a)(D, 2),
              T = (R[0], R[1]),
              E = Object(a.useState)(null),
              I = Object(o.a)(E, 2),
              L = (I[0], I[1]),
              B = Object(a.useState)(null),
              U = Object(o.a)(B, 2),
              M = (U[0], U[1]),
              F = Object(a.useState)(null),
              Y = Object(o.a)(F, 2),
              N = (Y[0], Y[1]),
              q = Object(a.useState)([]),
              z = Object(o.a)(q, 2),
              K = (z[0], z[1]),
              V = Object(a.useState)(null),
              H = Object(o.a)(V, 2),
              W = (H[0], H[1], Object(a.useState)(null)),
              Q = Object(o.a)(W, 2),
              G = (Q[0], Q[1]),
              J = Object(a.useState)(null),
              X = Object(o.a)(J, 2),
              Z = X[0],
              $ = X[1],
              ee = Object(a.useState)(null),
              te = Object(o.a)(ee, 2),
              ne = te[0],
              ie = te[1],
              ae = Object(a.useState)(null),
              ce = Object(o.a)(ae, 2),
              se = (ce[0], ce[1]),
              re = Object(a.useState)(1),
              oe = Object(o.a)(re, 2),
              le = oe[0],
              je = oe[1];
            Object(a.useEffect)(function () {
              l && r(),
                null === l && h(!0),
                null !== l && "user" !== l.role && h(!0),
                i(xe),
                c();
            }, []),
              Object(a.useEffect)(
                function () {
                  M(null), G(null), T(null), K(null);
                },
                [le]
              );
            var de = function (e) {
                S(e.target.value);
              },
              ue = function (e, t, n, i, a, c, s, r) {
                ie(e), L(n), $(e), T(t), G(i), se(a), M(c), K(s), N(r);
              },
              be = function (e) {
                je(e.target.value);
              },
              xe = function (e) {
                G(e);
              };
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsxs)("div", {
                  style: { width: "100%", float: "left" },
                  children: [
                    Object(u.jsx)(Zt, {
                      isOpen: t,
                      toggleSidebar: function () {
                        n();
                      },
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        position: "relative",
                        left: "15vw",
                        flexDirection: "column",
                        height: "100vh",
                      },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            marginLeft: "6vh",
                            flexDirection: "row",
                          },
                          children: [
                            Object(u.jsx)("h1", {
                              style: { marginTop: "1vw", paddingBottom: "2vh" },
                              children: "Training:",
                            }),
                            Object(u.jsx)("div", {
                              style:
                                1 === le
                                  ? {
                                      marginTop: "1vw",
                                      position: "relative",
                                      left: "58svw",
                                    }
                                  : {
                                      marginTop: "1vw",
                                      position: "relative",
                                      left: "48.5vw",
                                    },
                            }),
                          ],
                        }),
                        Object(u.jsxs)(oi.d, {
                          children: [
                            Object(u.jsxs)(oi.b, {
                              style: {
                                marginLeft: "3vw",
                                marginTop: "0vh",
                                paddingTop: "0vh",
                              },
                              children: [
                                Object(u.jsx)(oi.a, {
                                  value: 1,
                                  onClick: function (e) {
                                    return be(e);
                                  },
                                  children: "Mapping",
                                }),
                                Object(u.jsx)(oi.a, {
                                  value: 2,
                                  onClick: function (e) {
                                    return be(e);
                                  },
                                  children: "Validation",
                                }),
                                Object(u.jsx)(oi.a, {
                                  value: 2,
                                  onClick: function (e) {
                                    return be(e);
                                  },
                                  children: "Project Specific",
                                }),
                              ],
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)(It, {
                                rowsPerPage: w,
                                page: p,
                                setPage: f,
                                handleChangeRowsPerPage: de,
                                requestSelected: Z,
                                handleSetRequestSelected: function (
                                  e,
                                  t,
                                  n,
                                  i,
                                  a,
                                  c,
                                  s
                                ) {
                                  L(n), $(e), T(t), G(i), se(a), M(c), K(s);
                                },
                              }),
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)(Lt, {
                                rowsPerPage: w,
                                page: p,
                                setPage: f,
                                handleChangeRowsPerPage: de,
                                paymentSelected: ne,
                                handleSetPaymentSelected: ue,
                              }),
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)(Lt, {
                                rowsPerPage: w,
                                page: p,
                                setPage: f,
                                handleChangeRowsPerPage: de,
                                paymentSelected: ne,
                                handleSetPaymentSelected: ue,
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                x
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        ta =
          (n(201),
          function () {
            var e = Object(a.useContext)(ye),
              t = e.sidebarOpen,
              n = e.handleSetSidebarState,
              i = Object(a.useContext)(m),
              c = i.refresh,
              s = i.user,
              r = Object(a.useState)(!1),
              l = Object(o.a)(r, 2),
              d = l[0],
              b = l[1],
              x = Object(a.useState)(0),
              h = Object(o.a)(x, 2),
              g = h[0],
              O = h[1],
              p = Object(a.useState)(1),
              f = Object(o.a)(p, 2),
              v = f[0],
              y = f[1],
              w = Object(a.useState)(10),
              S = Object(o.a)(w, 2),
              _ = S[0],
              k = S[1],
              A = C(!1),
              P = Object(o.a)(A, 2),
              D = (P[0], P[1], C(!1)),
              R = Object(o.a)(D, 2),
              T = R[0],
              E = R[1],
              I = Object(a.useState)(null),
              L = Object(o.a)(I, 2),
              B = L[0],
              U = L[1],
              M = Object(a.useState)(null),
              F = Object(o.a)(M, 2),
              Y = F[0],
              N = F[1],
              q = Object(a.useState)(null),
              z = Object(o.a)(q, 2),
              K = z[0],
              V = z[1],
              H = Object(a.useState)(null),
              W = Object(o.a)(H, 2),
              Q = W[0],
              G = W[1],
              J = Object(a.useState)(null),
              X = Object(o.a)(J, 2),
              Z = X[0],
              $ = X[1],
              ee = Object(a.useState)(null),
              te = Object(o.a)(ee, 2),
              ne = te[0],
              ie = te[1],
              ae = Object(a.useState)(null),
              ce = Object(o.a)(ae, 2),
              se = ce[0],
              re = ce[1],
              oe = Object(a.useState)(null),
              le = Object(o.a)(oe, 2),
              je = le[0],
              de = le[1],
              ue = Object(a.useState)(null),
              be = Object(o.a)(ue, 2),
              xe = be[0],
              he = be[1],
              ge = Object(a.useState)(null),
              Oe = Object(o.a)(ge, 2),
              pe = Oe[0],
              fe = Oe[1],
              me = Object(a.useState)(null),
              ve = Object(o.a)(me, 2),
              we = ve[0],
              Se = ve[1],
              _e = Object(a.useState)(null),
              ke = Object(o.a)(_e, 2),
              Ae = ke[0],
              Ce = ke[1],
              Pe = Object(a.useState)(null),
              De = Object(o.a)(Pe, 2),
              Re = De[0],
              Te = De[1],
              Ee = Object(a.useState)(null),
              Ie = Object(o.a)(Ee, 2),
              Le = Ie[0],
              Be = Ie[1],
              Ue = Object(a.useState)(null),
              Me = Object(o.a)(Ue, 2),
              Fe = Me[0],
              Ye = Me[1],
              Ne = Object(a.useState)(null),
              qe = Object(o.a)(Ne, 2),
              ze = qe[0],
              Ke = qe[1],
              Ve = Object(a.useState)(null),
              He = Object(o.a)(Ve, 2),
              We = He[0],
              Qe = He[1],
              Ge = Object(a.useState)(null),
              Je = Object(o.a)(Ge, 2),
              Xe = Je[0],
              Ze = Je[1],
              $e = Object(a.useState)(1),
              et = Object(o.a)($e, 2),
              tt = et[0],
              nt = et[1];
            Object(a.useEffect)(function () {
              s && c(),
                null === s && b(!0),
                null !== s && "admin" !== s.role && b(!0);
            }, []),
              Object(a.useEffect)(function () {}, [tt]);
            var it = function (e) {
                k(e.target.value);
              },
              at = function () {
                E();
              },
              ct = function (e) {
                nt(e.target.value);
              };
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsx)(Zi, {
                  addOpen: T,
                  handleAddOpen: at,
                  URL: B,
                  handleSetURL: function (e) {
                    U(e.target.value);
                  },
                  pointValue: Y,
                  handleSetPointValue: function (e) {
                    N(e.target.value);
                  },
                  difficulty: K,
                  handleSetDifficulty: function (e) {
                    V(e.target.value);
                  },
                  modalPage: v,
                  handleSetModalPage: function () {
                    1 === v && B && K && Y && y(2),
                      2 === v && Q && Z && ne && se && je && y(3),
                      3 === v ? xe && pe && we && Ae && Re && y(4) : at();
                  },
                  question1: Q,
                  answer1: Z,
                  incorrect1_1: ne,
                  incorrect1_2: se,
                  incorrect1_3: je,
                  question2: xe,
                  answer2: pe,
                  incorrect2_1: we,
                  incorrect2_2: Ae,
                  incorrect2_3: Re,
                  question3: Le,
                  answer3: Fe,
                  incorrect3_1: ze,
                  incorrect3_2: We,
                  incorrect3_3: Xe,
                  handleSetQuestion: function (e, t) {
                    1 === e && G(t.target.value),
                      2 === e && he(t.target.value),
                      3 === e && Be(t.target.value);
                  },
                  handleSetAnswer: function (e, t) {
                    1 === e && $(t.target.value),
                      2 === e && fe(t.target.value),
                      3 === e && Ye(t.target.value);
                  },
                  handleSetIncorrect: function (e, t, n) {
                    1 === e &&
                      (1 === t && ie(n.target.value),
                      2 === t && re(n.target.value),
                      3 === t && de(n.target.value)),
                      2 === e &&
                        (1 === t && Se(n.target.value),
                        2 === t && Ce(n.target.value),
                        3 === t && Te(n.target.value)),
                      3 === e &&
                        (1 === t && Ke(n.target.value),
                        2 === t && Qe(n.target.value),
                        3 === t && Ze(n.target.value));
                  },
                }),
                Object(u.jsxs)("div", {
                  style: { width: "100%", float: "left" },
                  children: [
                    Object(u.jsx)(Zt, {
                      isOpen: t,
                      toggleSidebar: function () {
                        n();
                      },
                    }),
                    Object(u.jsxs)("div", {
                      style: {
                        display: "flex",
                        position: "relative",
                        left: "15vw",
                        flexDirection: "column",
                        height: "100vh",
                      },
                      children: [
                        Object(u.jsxs)("div", {
                          style: {
                            display: "flex",
                            marginLeft: "6vh",
                            flexDirection: "row",
                          },
                          children: [
                            Object(u.jsx)("h1", {
                              style: { marginTop: "1vw", paddingBottom: "2vh" },
                              children: "Training:",
                            }),
                            Object(u.jsx)("div", {
                              style: { marginLeft: "40vw", marginTop: "1vh" },
                              children: Object(u.jsx)(Dt, {
                                button1: !0,
                                button1_text: "Add",
                                button1_action: at,
                                button2: !0,
                                button2_text: "Edit",
                                button3: !0,
                                button3_text: "Delete",
                              }),
                            }),
                          ],
                        }),
                        Object(u.jsxs)(oi.d, {
                          children: [
                            Object(u.jsxs)(oi.b, {
                              style: {
                                marginLeft: "3vw",
                                marginTop: "0vh",
                                paddingTop: "0vh",
                              },
                              children: [
                                Object(u.jsx)(oi.a, {
                                  value: 1,
                                  onClick: function (e) {
                                    return ct(e);
                                  },
                                  children: "Mapping",
                                }),
                                Object(u.jsx)(oi.a, {
                                  value: 2,
                                  onClick: function (e) {
                                    return ct(e);
                                  },
                                  children: "Validation",
                                }),
                                Object(u.jsx)(oi.a, {
                                  value: 2,
                                  onClick: function (e) {
                                    return ct(e);
                                  },
                                  children: "Project Specific",
                                }),
                              ],
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)($i, {
                                rowsPerPage: _,
                                page: g,
                                setPage: O,
                                handleChangeRowsPerPage: it,
                              }),
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)($i, {
                                rowsPerPage: _,
                                page: g,
                                setPage: O,
                                handleChangeRowsPerPage: it,
                              }),
                            }),
                            Object(u.jsx)(oi.c, {
                              children: Object(u.jsx)($i, {
                                rowsPerPage: _,
                                page: g,
                                setPage: O,
                                handleChangeRowsPerPage: it,
                              }),
                            }),
                          ],
                        }),
                      ],
                    }),
                  ],
                }),
                d
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          }),
        na =
          (n(202),
          n(203),
          Pe.b.div(qn || (qn = Object(Ce.a)(["\n  width: 100vw;\n"]))),
          Pe.b.div(
            zn ||
              (zn = Object(Ce.a)([
                "\n  font-weight: bold;\n  font-size: 14px;\n  line-height: 1.4285em;\n  color: rgba(0, 0, 0, 0.87);\n  box-sizing: inherit;\n  display: flex;\n  flex-direction: column;\n",
              ]))
          ),
          Pe.b.div(
            Kn ||
              (Kn = Object(Ce.a)([
                '\n  margin: 1em;\n  background-color: white;\n  border: 0.75px solid black;\n  border-radius: 1.5em;\n  font-family: Lato, "Helvetica Neue", Arial, Helvetica, sans-serif;\n  font-size: 14px;\n  line-height: 1.4285em;\n  color: rgba(0, 0, 0, 0.87);\n  box-sizing: inherit;\n  display: flex;\n  align-items: center;\n  justify-content: center;\n',
              ]))
          ),
          Pe.b.button(
            Vn ||
              (Vn = Object(Ce.a)([
                "\n  font-family: sans-serif;\n  font-size: 100%;\n  align-self: center;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  line-height: 1.15;\n  overflow: visible;\n  text-transform: none;\n  border-radius: 6px;\n  margin-top: 1em;\n  margin-bottom: 1em;\n  background-color: #f4753c;\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  cursor: ",
                ";\n  &:hover {\n    background-color: ",
                ";\n  }\n",
              ])),
            function (e) {
              return e.disabled ? "not-allowed" : "pointer";
            },
            function (e) {
              return e.disabled ? "gray" : "#c85823";
            }
          ),
          Pe.b.input(
            Hn ||
              (Hn = Object(Ce.a)([
                "\n  box-sizing: inherit;\n  font-family: sans-serif;\n  font-size: 100%;\n  line-height: 1.15;\n  overflow: visible;\n  width: 90%;\n  display: flex;\n  align-self: center;\n  padding: 12px 20px;\n  margin: 8px 0;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n",
              ]))
          ),
          Pe.b.textarea(
            Wn ||
              (Wn = Object(Ce.a)([
                "\n  font-family: sans-serif;\n  font-size: 100%;\n  line-height: 1.15;\n  overflow: visible;\n  width: 90%;\n  display: flex;\n  align-self: center;\n  padding: 12px 20px;\n  height: 75%;\n  resize: none;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  box-sizing: border-box;\n",
              ]))
          ),
          Pe.b.p(
            Qn ||
              (Qn = Object(Ce.a)([
                "\n  display: flex;\n  align-self: center;\n  justify-content: center;\n  align-items: center;\n  font-weight: 400;\n  width: 75%;\n",
              ]))
          ),
          Pe.b.h4(
            Gn ||
              (Gn = Object(Ce.a)([
                "\n  display: flex;\n  justify-content: center;\n  align-items: center;\n",
              ]))
          ),
          Pe.b.div(
            Jn ||
              (Jn = Object(Ce.a)([
                "\n  width: 100vw;\n  display: flex;\n  flex-direction: column;\n  align-items: center;\n  justify-content: center;\n  height: 100vh;\n  transition: all 0.4s ease;\n\n  ",
                "\n",
              ])),
            function (e) {
              return e.modalShown
                ? "filter: blur(10px) grayscale(50%);\n  -webkit-filter: blur(10px) grayscale(50%);\n  -webkit-transform: scale(0.9);\n  pointer-events: none;"
                : "";
            }
          )),
        ia = Pe.b.form(
          Xn ||
            (Xn = Object(Ce.a)([
              "\n  font-size: 16px;\n  line-height: 2;\n  max-width: 450px;\n  width: 100%;\n  text-align: center;\n",
            ]))
        ),
        aa =
          (Pe.b.img(
            Zn ||
              (Zn = Object(Ce.a)([
                "\n  height: 35vh;\n  margin-left: auto;\n  margin-right: auto;\n  display: block;\n",
              ]))
          ),
          Pe.b.h1(
            $n ||
              ($n = Object(Ce.a)([
                "\n  text-align: center;\n  font-size: 35px;\n  color: #253e45;\n",
              ]))
          )),
        ca = Pe.b.input(
          ei ||
            (ei = Object(Ce.a)([
              "\n  width: 80%;\n  padding: 12px 20px;\n  margin: 8px 0;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  box-sizing: border-box;\n",
            ]))
        ),
        sa = Pe.b.input(
          ti ||
            (ti = Object(Ce.a)([
              "\n  width: 38%;\n  padding: 12px 20px;\n  margin: 8px 8px;\n  display: inline-block;\n  border: 1px solid #ccc;\n  border-radius: 6px;\n  box-sizing: border-box;\n",
            ]))
        ),
        ra =
          (Pe.b.button(
            ni ||
              (ni = Object(Ce.a)([
                "\n  margin: 15px 0px;\n  margin-right: 10px;\n  width: 25%;\n  background-color: #f4753c;\n  color: white;\n  padding: 14px 20px;\n  border: none;\n  border-radius: 6px;\n  cursor: pointer;\n  &:hover {\n    background-color: #c85823;\n  }\n",
              ]))
          ),
          function () {
            var e = Object(a.useState)(""),
              t = Object(o.a)(e, 2),
              n = t[0],
              i = t[1],
              c = Object(a.useState)(""),
              s = Object(o.a)(c, 2),
              r = s[0],
              l = s[1],
              d = Object(a.useState)(""),
              b = Object(o.a)(d, 2),
              x = b[0],
              h = b[1],
              O = Object(a.useState)(""),
              p = Object(o.a)(O, 2),
              f = p[0],
              m = p[1],
              v = Object(a.useState)(""),
              S = Object(o.a)(v, 2),
              _ = S[0],
              k = S[1],
              A = Object(a.useState)(null),
              P = Object(o.a)(A, 2),
              D = P[0],
              R = P[1],
              T = Object(a.useState)(null),
              E = Object(o.a)(T, 2),
              I = E[0],
              L = E[1],
              B = C(!1),
              U = Object(o.a)(B, 2),
              M = U[0],
              F = U[1],
              Y = (function () {
                var e = Object(w.a)(
                  Object(y.a)().mark(function e() {
                    var t, i, a, c, s;
                    return Object(y.a)().wrap(function (e) {
                      for (;;)
                        switch ((e.prev = e.next)) {
                          case 0:
                            return (
                              (t = {
                                firstName: n,
                                lastName: r,
                                email: x,
                                password: f,
                                org: _,
                                int: "micro",
                              }),
                              (i = "".concat(
                                g,
                                "auth/register_user?method=user&integrations=micro"
                              )),
                              (e.next = 4),
                              fetch(i, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(t),
                              })
                            );
                          case 4:
                            if (!(a = e.sent).ok) {
                              e.next = 15;
                              break;
                            }
                            return (e.next = 8), a.json();
                          case 8:
                            return (
                              (c = e.sent),
                              (s = c.code),
                              L(s),
                              0 === s
                                ? R(
                                    "Mikro integration added to your Kaart account, you may log into Mikro any time."
                                  )
                                : 1 === s
                                ? R(
                                    "Account already exists with Mikro integration, you may log into Mikro any time."
                                  )
                                : 2 === s &&
                                  R(
                                    "Your Kaart account has been created with Mikro integration, press the button below to activate your account!"
                                  ),
                              e.abrupt("return", {
                                responseMessage: D,
                                responseCode: I,
                              })
                            );
                          case 15:
                            throw new Error(
                              "Failed to register user: "
                                .concat(a.status, " ")
                                .concat(a.statusText)
                            );
                          case 16:
                          case "end":
                            return e.stop();
                        }
                    }, e);
                  })
                );
                return function () {
                  return e.apply(this, arguments);
                };
              })();
            return Object(u.jsxs)(u.Fragment, {
              children: [
                Object(u.jsxs)(na, {
                  children: [
                    Object(u.jsxs)(ia, {
                      children: [
                        Object(u.jsx)(aa, { children: "Sign Up Now" }),
                        Object(u.jsx)(sa, {
                          type: "text",
                          name: "First Name",
                          placeholder: "First Name",
                          onChange: function (e) {
                            i(e.target.value);
                          },
                        }),
                        Object(u.jsx)(sa, {
                          type: "text",
                          name: "Last Name",
                          placeholder: "Last Name",
                          onChange: function (e) {
                            l(e.target.value);
                          },
                        }),
                        Object(u.jsx)(ca, {
                          type: "text",
                          name: "Email",
                          placeholder: "Email",
                          onChange: function (e) {
                            h(e.target.value);
                          },
                        }),
                        Object(u.jsx)(ca, {
                          type: "text",
                          name: "Password",
                          placeholder: "Password",
                          onChange: function (e) {
                            m(e.target.value);
                          },
                        }),
                        Object(u.jsx)(ca, {
                          type: "text",
                          name: "Organization",
                          placeholder: "Organization",
                          onChange: function (e) {
                            k(e.target.value);
                          },
                        }),
                        I && I
                          ? Object(u.jsx)(u.Fragment, {
                              children: Object(u.jsx)(At, {
                                style: { marginTop: "2vh" },
                                subtitle_text: D,
                              }),
                            })
                          : Object(u.jsx)(u.Fragment, {}),
                      ],
                    }),
                    Object(u.jsx)(_t, {
                      confirm_text:
                        !I || (0 !== I && 1 !== I && 2 !== I)
                          ? 3 === I
                            ? "Activate Account"
                            : "Submit"
                          : "Log In",
                      confirm_action: 0 === I || 1 === I || 2 === I ? F : Y,
                    }),
                  ],
                }),
                M
                  ? Object(u.jsx)(j.a, { push: !0, to: "/login" })
                  : Object(u.jsx)(u.Fragment, {}),
              ],
            });
          });
      var oa = function () {
        var e = Object(a.useContext)(m),
          t = e.refresh;
        return (
          e.user,
          Object(a.useEffect)(function () {
            var e = setInterval(function () {
              t();
            }, 117e4);
            return function () {
              return clearInterval(e);
            };
          }, []),
          Object(u.jsx)(u.Fragment, {
            children: Object(u.jsx)(Ve.a, {
              children: Object(u.jsx)(x, {
                children: Object(u.jsx)(we, {
                  children: Object(u.jsxs)(j.d, {
                    children: [
                      Object(u.jsx)(j.b, {
                        exact: !0,
                        path: "/",
                        children: Object(u.jsx)(ri, {}),
                      }),
                      Object(u.jsx)(j.b, {
                        path: "/login",
                        children: Object(u.jsx)(Ke, {}),
                      }),
                      Object(u.jsx)(j.b, {
                        path: "/welcome",
                        children: Object(u.jsx)(Ji, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/dashboard",
                        children: Object(u.jsx)(Bi, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/admindash",
                        admin: !0,
                        children: Object(u.jsx)($t, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/AdminProjectsPage",
                        admin: !0,
                        children: Object(u.jsx)(pi, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/UserProjectsPage",
                        children: Object(u.jsx)(qi, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/AdminUsersPage",
                        admin: !0,
                        children: Object(u.jsx)(Ci, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/AdminPaymentsPage",
                        admin: !0,
                        children: Object(u.jsx)(Ii, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/UserPaymentsPage",
                        children: Object(u.jsx)(Wi, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/AdminTrainingPage",
                        admin: !0,
                        children: Object(u.jsx)(ta, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/UserTrainingPage",
                        children: Object(u.jsx)(ea, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/AdminAccountPage",
                        admin: !0,
                        children: Object(u.jsx)(Li, {}),
                      }),
                      Object(u.jsx)(Ae, {
                        path: "/UserAccountPage",
                        children: Object(u.jsx)(zi, {}),
                      }),
                      Object(u.jsx)(j.b, {
                        path: "/registerUser",
                        children: Object(u.jsx)(ra, {}),
                      }),
                      Object(u.jsx)(j.b, {
                        exact: !0,
                        path: "/hotkeys",
                        component: ii,
                      }),
                      Object(u.jsx)(j.b, { component: tn }),
                    ],
                  }),
                }),
              }),
            }),
          })
        );
      };
      Boolean(
        "dev.localhost" === window.location.hostname ||
          "[::1]" === window.location.hostname ||
          window.location.hostname.match(
            /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
          )
      );
      n(204), n(211), n(205), n(206);
      r.a.render(
        Object(u.jsx)(c.a.StrictMode, {
          children: Object(u.jsx)(v, { children: Object(u.jsx)(oa, {}) }),
        }),
        document.getElementById("root")
      ),
        "serviceWorker" in navigator &&
          navigator.serviceWorker.ready
            .then(function (e) {
              e.unregister();
            })
            .catch(function (e) {
              console.error(e.message);
            });
    },
  },
  [[210, 1, 2]],
]);
//# sourceMappingURL=main.5fe4fd84.chunk.js.map
